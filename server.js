const express = require('express');
const PDFDocument = require('pdfkit');
const { Buffer } = require('buffer');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 1212;

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/generate-pdf', (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  // Extract base64 data from data URL
  const base64Data = image.replace(/^data:image\/png;base64,/, '');

  // Create a new PDF document with landscape orientation
  const doc = new PDFDocument({ size: [841.89, 595.28] }); // A4 landscape dimensions in points

  // Set headers to indicate file type and attachment
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');

  // Pipe PDF into response
  doc.pipe(res);

  // Get PDF dimensions
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Add the image to the PDF, scaling it to fit the full page
  doc.image(Buffer.from(base64Data, 'base64'), 0, 0, {
    width: pageWidth,
    height: pageHeight,
    align: 'center',
    valign: 'center',
  });

  // Finalize the PDF and end the stream
  doc.end();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
