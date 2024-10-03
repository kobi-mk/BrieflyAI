const express = require('express');
const cors = require('cors');
const fs = require('fs');
const dotenv = require('dotenv');
const pdf = require('pdf-parse');
const fileUpload = require('express-fileupload');
const path = require('path');
const { HfInference } = require('@huggingface/inference'); // Hugging Face Inference

// Load environment variables from the .env file
dotenv.config();

// Initialize Hugging Face Inference
const hf = new HfInference("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"); // Use your Hugging Face API Key

const PORT = 8800;
const app = express();

// Enable cross-origin requests and handle JSON payloads up to 5MB
app.use(cors({
  origin: 'http://16.171.10.80:3000', // Change this to the front-end URL
  methods: 'GET,POST',
}));
app.use(express.json({ limit: '5mb' }));

// Configure file upload handling
app.use(
  fileUpload({
    tempFileDir: path.join(__dirname, 'tmp'),
    useTempFiles: true,
    debug: true,
  })
);

// POST endpoint to handle text summarization
app.post('/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided for summarization.' });
  }

  try {
    // Send the text to Hugging Face BART model for summarization
    const summary = await hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: text,
    });

    res.json({ summary: summary.summary_text });
  } catch (error) {
    console.error('Error during text summarization:', error);
    res.status(500).json({ error: 'Error summarizing text.' });
  }
});

// POST endpoint to handle file uploads and summarize the PDF
app.post('/summary', async function (req, res) {
  let sampleFile;
  let uploadPath;

  // Check if a file was uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded. Try again.');
  }

  // Retrieve the uploaded file
  sampleFile = req.files.uploadedfile;

  // Ensure the upload directory exists
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Set the file upload path
  uploadPath = path.join(uploadDir, sampleFile.name);

  // Save the file to the server
  sampleFile.mv(uploadPath, async function (err) {
    if (err) {
      console.error('Error saving file:', err);
      return res.status(500).send('Failed to upload file.');
    }

    console.log('File saved at:', uploadPath);

    try {
      // Read the PDF file
      let dataBuffer = fs.readFileSync(uploadPath);
      console.log('File read successfully.');

      // Parse the PDF and extract text
      let data = await pdf(dataBuffer);
      console.log('PDF parsed successfully:', data.text.substring(0, 100));

      // Check if the PDF contains text
      if (!data.text) {
        throw new Error('Failed to extract text from PDF.');
      }

      // Use BART for summarization
      const summary = await hf.summarization({
        model: 'facebook/bart-large-cnn',
        inputs: data.text + ' TL;DR',
      });

      // Clean up the file after processing
      fs.unlinkSync(uploadPath);

      // Send the summary response back to the client
      res.json({
        id: new Date().getTime(),
        text: summary.summary_text,
      });
    } catch (error) {
      console.error('Error during processing:', error);
      res.status(500).json({ error: 'An error occurred while summarizing the PDF.' });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
