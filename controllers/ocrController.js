const { createWorker } = require("tesseract.js");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const Design = require("../models/Design");
const Salesman = require("../models/Salesman");
const Manager = require("../models/Manager");

// Process image with OCR and extract text
const processImageOCR = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { userId, userType } = req.body;

    // Validate user exists based on type
    let user;
    if (userType === "salesman") {
      user = await Salesman.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Salesman not found" });
      }
    } else if (userType === "manager") {
      user = await Manager.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Manager not found" });
      }
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Get file details
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const fullPath = path.resolve(filePath);

    // Base path for optimized images
    const baseOptimizedPath = path.join(
      path.dirname(filePath),
      "optimized-" + fileName
    );

    // Create versions array including the original image without modifications
    const optimizationVersions = [
      {
        path: filePath, // Use the original image directly
        description: "Original unmodified image",
        isOriginal: true,
      },
      {
        path: baseOptimizedPath + "-simple.jpg",
        description: "Simple grayscale conversion",
        isOriginal: false,
        process: (img) => img.greyscale(),
      },
    ];

    // Process the simple version (we'll use the original as-is)
    for (const version of optimizationVersions) {
      if (!version.isOriginal && version.process) {
        await version.process(sharp(filePath)).toFile(version.path);
        console.log(`Created ${version.description} at: ${version.path}`);
      }
    }

    // Perform OCR on the optimized image using the updated Tesseract.js API
    const worker = await createWorker("eng");

    // Set minimal parameters for better results with original images
    await worker.setParameters({
      tessedit_pageseg_mode: "3", // Fully automatic page segmentation
      tessedit_ocr_engine_mode: "2", // Use LSTM neural network mode
      preserve_interword_spaces: "1",
    });

    // Try OCR on all optimized versions and use the best result
    let bestResult = null;
    let bestScore = 0;

    for (const version of optimizationVersions) {
      console.log(`Starting OCR recognition on ${version.path}...`);
      const result = await worker.recognize(version.path);

      // Simple heuristic to score the result quality
      const score = scoreOcrResult(result.data.text);
      console.log(`OCR score for ${version.path}: ${score}`);

      if (score > bestScore) {
        bestScore = score;
        bestResult = result;
      }

      // Clean up this version if it's not the best and not the original
      if (bestResult !== result && !version.isOriginal) {
        fs.unlinkSync(version.path);
      }
    }

    // If we found a result, use it
    if (!bestResult) {
      throw new Error("OCR failed on all image versions");
    }

    const { data } = bestResult;
    await worker.terminate();

    // Extract structured data from the OCR text
    const extractedText = data.text;
    console.log("Extracted text:", extractedText);

    // Extract category and design number
    const category = extractCategory(extractedText);
    const designNumber = extractDesignNumber(extractedText);

    // Create structured output format
    const extractedData = {
      text: extractedText,
      category: category,
      design: designNumber,
    };

    // Save design record
    const design = new Design({
      userId: userId,
      filename: fileName,
      category: category,
      designNumber: designNumber,
      path: filePath,
      fullPath: fullPath,
    });

    await design.save();

    // Clean up any remaining optimized images (but not the original)
    for (const version of optimizationVersions) {
      try {
        if (!version.isOriginal && fs.existsSync(version.path)) {
          fs.unlinkSync(version.path);
        }
      } catch (cleanupErr) {
        console.error(`Error cleaning up ${version.path}:`, cleanupErr);
      }
    }

    // Return the response in the required format
    res.status(200).json({
      message: "Image processed successfully",
      extractedData: {
        category: extractedData.category,
        design: extractedData.design,
      },
      fullText: extractedData.text,
      file: {
        filename: fileName,
        originalname: req.file.originalname,
      },
      designId: design._id,
    });
  } catch (err) {
    console.error("Error processing image:", err);
    res.status(500).json({
      message: "Error processing image",
      error: err.message,
    });
  }
};

// Extract design number from OCR text
function extractDesignNumber(text) {
  if (!text) return "UNKNOWN";

  // First, check for product names with numbers (like "RANGEEN 463")
  const productNamePattern = /(RANGEEN|PRODUCT|ITEM|DESIGN)[\s-]+\d+/i;
  const productMatch = text.match(productNamePattern);
  if (productMatch) {
    return productMatch[0].trim();
  }

  // Patterns to identify design numbers
  const designPatterns = [
    // Explicit design number patterns
    /DESIGN\s*(?:NO|NUMBER)?[:\s]*(\d+)/i, // DESIGN NO: 1234
    /(?:NO|NUMBER)[:\s]*(\d+)/i, // NO: 1234

    // Product code patterns that might be design numbers
    /(?:^|\s)([A-Z]\d{3,5})(?:\s|$)/, // D1234 or R463

    // First line if it contains a number
    /^([A-Z]+[\s-]+\d+)(?:\s|\n|$)/i, // First line with text and number
  ];

  // Try each pattern
  for (const pattern of designPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // If no match found, use the first line if it's not too long
  const firstLine = text.split("\n")[0].trim();
  if (firstLine && firstLine.length < 30) {
    return firstLine;
  }

  // Last resort: look for any 3-5 digit number
  const numberMatch = text.match(/\b\d{3,5}\b/);
  if (numberMatch) {
    return numberMatch[0];
  }

  return "UNKNOWN";
}

// Extract category from OCR text
function extractCategory(text) {
  if (!text) return "UNKNOWN";

  // Look for material descriptions in the second line (common pattern)
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length >= 2) {
    // Check for material description in second line
    const secondLine = lines[1].trim();

    // Check for weight + material pattern (e.g., "22KG HEAVY REYON")
    const weightMaterialMatch = secondLine.match(/(\d+KG\s+[A-Z\s]+)$/i);
    if (weightMaterialMatch) {
      return weightMaterialMatch[1].trim();
    }

    // Check for material type pattern
    const materialMatch = secondLine.match(
      /((?:HEAVY|LIGHT|MICRO)\s+[A-Z]+)$/i
    );
    if (materialMatch) {
      return materialMatch[1].trim();
    }

    // If second line is not too long, use it as category
    if (secondLine.length < 30) {
      return secondLine;
    }
  }

  // Patterns to identify categories
  const categoryPatterns = [
    // Explicit category patterns
    /CATEGORY[:\s]+([A-Z0-9\s]+)(?:\n|$)/i, // CATEGORY: MICRO DYING
    /TYPE[:\s]+([A-Z0-9\s]+)(?:\n|$)/i, // TYPE: MICRO DYING

    // Material or process descriptions that might be categories
    /((?:HEAVY|LIGHT|MICRO)\s+[A-Z]+)(?:\s|\n|$)/i, // HEAVY REYON or MICRO DYING
    /(\d+KG\s+[A-Z]+)(?:\s|\n|$)/i, // 22KG HEAVY

    // Print or process types
    /([A-Z]+\s+PRINT)(?:\s|\n|$)/i, // DISCHARGE PRINT
  ];

  // Try each pattern
  for (const pattern of categoryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // If no specific category found and we have at least 3 lines, try the third line
  if (lines.length >= 3) {
    const thirdLine = lines[2].trim();
    if (thirdLine.length < 30) {
      return thirdLine;
    }
  }

  return "UNKNOWN";
}

// Helper function to score OCR result quality
function scoreOcrResult(text) {
  if (!text) return 0;

  let score = 0;

  // More words is generally better
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  score += words.length * 2;

  // Longer words are more likely to be real words
  const longWords = words.filter((w) => w.length > 3);
  score += longWords.length * 3;

  // Fewer special characters is generally better
  const specialChars = text.replace(/[a-zA-Z0-9\s]/g, "");
  score -= specialChars.length;

  // Presence of common words indicates better OCR
  const commonWords = [
    "the",
    "and",
    "for",
    "with",
    "design",
    "number",
    "code",
    "type",
    "category",
  ];
  for (const word of commonWords) {
    if (text.toLowerCase().includes(word)) {
      score += 5;
    }
  }

  // Presence of patterns we're looking for is a strong indicator
  if (extractDesignNumber(text) !== "UNKNOWN") score += 20;
  if (extractCategory(text) !== "UNKNOWN") score += 20;

  return score;
}

// Get all designs for a user
const getDesignsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const designs = await Design.find({ userId }).sort({ uploadDate: -1 });

    res.json(designs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  processImageOCR,
  getDesignsByUser,
};
