const Order = require("../models/Order");
const axios = require("axios");
const FormData = require("form-data");

const sendPaymentWhatsApp = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order and populate client details
    const order = await Order.findById(orderId).populate("client");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Extract payment details
    const paymentStatus = order.paymentStatus;
    const paidAmount = order.paidAmount;
    const pendingAmount = order.dueAmount;

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

    // Send request to 11za API
    const response = await axios.post(
      "https://app.11za.in/apis/template/sendTemplate",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    res.json({
      message: "WhatsApp notification sent successfully",
      response: response.data,
    });
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    res.status(500).json({
      message: "Failed to send WhatsApp notification",
      error: error.message,
    });
  }
};

module.exports = {
  sendPaymentWhatsApp,
}; 