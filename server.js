const express = require("express");
const PDFDocument = require("pdfkit");
const { Buffer } = require("buffer");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const app = express();
const port = 1212;

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json({ limit: "10mb" }));

app.post("/generate-pdf", async (req, res) => {
  const { jsonObject, learnerName } = req.body;

  if (!jsonObject || !learnerName) {
    return res
      .status(400)
      .json({ error: "JSON object or learner name not provided" });
  }

  const doc = new PDFDocument({ size: [841.89, 595.28] }); // A4 landscape dimensions in points

  // Set headers to indicate file type and attachment
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="output.pdf"');

  // Pipe PDF into response
  doc.pipe(res);

  // Add the background image if it exists
  if (jsonObject.backgroundImage) {
    const response = await axios.get(jsonObject.backgroundImage, {
      responseType: "arraybuffer",
    });
    const img = response.data;
    doc.image(img, 0, 0, { width: doc.page.width, height: doc.page.height });
  }

  // Sort canvas elements by layerPosition
  // jsonObject.canvasElement.sort((a, b) => a.layerPosition - b.layerPosition);

  // Add canvas elements
  for (const element of jsonObject.canvasElement) {
    if (!element.visible) continue;

    if (element.type.toLocaleLowerCase() === "text") {
      // Ensure the text meets the minimum width requirement
      const text = element.text.replace("[Learner-Name]", learnerName);
      const minWidth = element.width; // Define the minimum width for the text

      const fontPath = path.join(__dirname, 'fonts', 'Times New Roman.ttf'); 

      // Calculate the actual width of the text
      doc.font(fontPath).fontSize(element.fontSize);
      const textWidth = doc.widthOfString(text, {
        textAlign: element.align
      });

      const textOptions = {
        align: element.textAlign,
        lineBreak: false,
        width: Math.max(minWidth, textWidth), // Set width to the larger of textWidth and minWidth
        height: element.height, // Set height to the given height in the element
      };

      if (textWidth > minWidth && element.align === 'center') {
        // Adjust the width to meet the minimum width requirement
        const adjustedWidth = textWidth - minWidth;
        element.left -= adjustedWidth/2 ;
    }

      console.log(minWidth)
      console.log(textWidth)

      doc
        .fontSize(element.fontSize)
        .fillColor(element.fill)
        .text(text, element.left, element.top, textOptions);
    } else if (element.type.toLocaleLowerCase() === "image") {
      const response = await axios.get(element.src, {
        responseType: "arraybuffer",
      });
      const img = response.data;
      doc.image(img, element.left, element.top, {
        width: element.width,
        height: element.height,
      });
    }
  }

  // Finalize the PDF and end the stream
  doc.end();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
