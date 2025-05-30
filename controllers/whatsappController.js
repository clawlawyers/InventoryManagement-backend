const Order = require("../models/Order");
const axios = require("axios");
const FormData = require("form-data");

// Configure axios defaults for better timeout handling
axios.defaults.timeout = 30000; // 30 seconds default timeout

const sendPaymentWhatsApp = async (req, res) => {
  console.log("=============================================");

  const { orderId } = req.params; // Move outside try block for error handling

  try {
    // Find the order and populate client details
    const order = await Order.findById(orderId).populate("client");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate required environment variables
    if (!process.env.ELEVENZA_AUTH_TOKEN) {
      console.error("ELEVENZA_AUTH_TOKEN is not configured");
      return res.status(500).json({
        message: "WhatsApp service not configured",
        error: "Missing authentication token",
      });
    }

    // Extract payment details
    const paymentStatus = order.paymentStatus;
    const paidAmount = order.paidAmount;
    const pendingAmount = order.dueAmount;

    // Validate client phone number
    if (!order.client.phone) {
      return res.status(400).json({
        message: "Client phone number is required for WhatsApp notification",
      });
    }

    console.log(
      `📱 Sending WhatsApp notification to ${order.client.phone} for order ${orderId}`
    );

    // Create form data for 11za API
    const formData = new FormData();
    formData.append("authToken", process.env.ELEVENZA_AUTH_TOKEN);
    formData.append("name", order.client.name);
    formData.append("sendto", order.client.phone);
    formData.append("originWebsite", "www.clawlaw.in");
    formData.append("templateName", "textile_app");
    formData.append("language", "en");
    formData.append("data[1]", paymentStatus);
    formData.append("data[2]", paidAmount.toString());
    formData.append("data[3]", pendingAmount.toString());

    // Send request to 11za API with timeout and retry logic
    let response;
    let lastError;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `📡 Attempt ${attempt}/${maxRetries} to send WhatsApp notification`
        );

        response = await axios.post(
          "https://app.11za.in/apis/template/sendTemplate",
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 30000, // 30 seconds timeout
          }
        );

        // If successful, break out of retry loop
        break;
      } catch (retryError) {
        lastError = retryError;
        console.log(`❌ Attempt ${attempt} failed:`, retryError.message);

        // If this is the last attempt, don't wait
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting 2 seconds before retry...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    // If all retries failed, throw the last error
    if (!response) {
      throw lastError;
    }

    console.log(
      `✅ WhatsApp notification sent successfully to ${order.client.phone}`
    );

    res.json({
      message: "WhatsApp notification sent successfully",
      response: response.data,
      details: {
        clientName: order.client.name,
        clientPhone: order.client.phone,
        paymentStatus,
        paidAmount,
        pendingAmount,
      },
    });
  } catch (error) {
    console.error("❌ Error sending WhatsApp notification:", error);

    // Handle specific error types
    let errorMessage = "Failed to send WhatsApp notification";
    let statusCode = 500;

    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      errorMessage = "WhatsApp service timeout - please try again later";
      statusCode = 408;
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorMessage = "WhatsApp service unavailable - please try again later";
      statusCode = 503;
    } else if (error.response) {
      // API returned an error response
      errorMessage = `WhatsApp API error: ${error.response.status} - ${error.response.statusText}`;
      statusCode = error.response.status;
    }

    res.status(statusCode).json({
      message: errorMessage,
      error: error.message,
      code: error.code,
      details: {
        orderId,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// Test endpoint to check WhatsApp service connectivity
const testWhatsAppService = async (req, res) => {
  try {
    console.log("🧪 Testing WhatsApp service connectivity...");

    // Check if auth token is configured
    if (!process.env.ELEVENZA_AUTH_TOKEN) {
      return res.status(500).json({
        message: "WhatsApp service not configured",
        error: "Missing ELEVENZA_AUTH_TOKEN environment variable",
      });
    }

    // Simple connectivity test
    const response = await axios.get("https://app.11za.in", {
      timeout: 10000, // 10 seconds timeout for test
    });

    res.json({
      message: "WhatsApp service is reachable",
      status: response.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ WhatsApp service test failed:", error.message);

    res.status(503).json({
      message: "WhatsApp service is not reachable",
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = {
  sendPaymentWhatsApp,
  testWhatsAppService,
};
