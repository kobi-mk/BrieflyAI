import { useEffect, useState } from "react";
import Delete from "./assets/delete.png";
import axios from "axios";
import { FaSun, FaMoon } from "react-icons/fa"; // Import icons

function App() {
  const [value, setValue] = useState("");
  const [data, setData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isCopy, setIsCopy] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const apiURL = "http://13.60.179.107:8800"; // Your backend server URL

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Handle text-based summarization using Hugging Face BART
  const handlesubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(apiURL + "/summarize", {
        text: value,
      });
      const text = response.data.summary;

      localStorage.setItem(
        "summary",
        JSON.stringify(data?.length > 0 ? [...data, text] : [text])
      );

      setSubmitting(false);
      fetchLocalStorage(); // Fetch summaries from local storage
    } catch (error) {
      setSubmitting(false);
      console.error("Error:", error);
    }
  };

  // Handle PDF upload for summarization
  const handleSubmitPDF = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const file = e.target.files[0];
    var formData = new FormData();
    formData.append("filename", "User File");
    formData.append("uploadedfile", file);

    try {
      const response = await axios.post(apiURL + "/summary", formData);
      console.log("Server Response:", response.data);

      localStorage.setItem(
        "summary",
        JSON.stringify(data?.length > 0 ? [...data, response.data.text] : [response.data.text])
      );
      setSubmitting(false);
      fetchLocalStorage(); // Fetch summaries from local storage
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setSubmitting(false);
    }
  };

  // Fetch summary data from localStorage
  const fetchLocalStorage = async () => {
    const result = await localStorage.getItem("summary");
    setData(JSON.parse(result)?.reverse() || []);
  };

  // Copy text to clipboard
  async function copyTextToClipboard(text) {
    if ("clipboard" in navigator) {
      return await navigator.clipboard.writeText(text);
    }
  }

  const handleCopy = (txt) => {
    copyTextToClipboard(txt)
      .then(() => {
        setIsCopy(true);
        setTimeout(() => {
          setIsCopy(false);
        }, 1500);
      })
      .catch((err) => console.error(err));
  };

  // Delete a summary from history
  const handleDelete = (txt) => {
    const filtered = data?.filter((d) => d !== txt);
    setData(filtered);
    localStorage.setItem("summary", JSON.stringify(filtered));
  };

  // On component mount, fetch data from local storage
  useEffect(() => {
    fetchLocalStorage();
  }, []);

  return (
    <div className={`w-full h-full min-h-[100vh] py-4 px-4 md:px-20 ${darkMode ? "bg-[#0f172a]" : "bg-white"} transition-colors`}>
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center w-full h-auto md:h-10 px-5 2xl:px-40">
          <h3 className={`cursor-pointer text-3xl font-bold ${darkMode ? "text-cyan-600" : "text-gray-900"}`}>BrieflyAI!</h3>
          <button 
            onClick={toggleDarkMode}
            className="flex items-center bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg mt-2 md:mt-0"
          >
            {darkMode ? <FaSun className="mr-2" /> : <FaMoon className="mr-2" />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center mt-4 p-4">
          <h1 className={`text-2xl md:text-3xl ${darkMode ? "text-white" : "text-gray-900"} text-center leading-10 font-semibold`}>
            Summarizer with <br />
            <span className="text-4xl md:text-5xl font-bold text-cyan-500">Hugging Face BART</span>
          </h1>
          <p className={`mt-5 text-lg ${darkMode ? "text-gray-500" : "text-gray-700"} sm:text-xl text-center max-w-2xl`}>
            Simply upload your document or paste text to get a quick summary using Hugging Face BART
          </p>
        </div>

        {/* Text Input Area */}
        <div className="flex flex-col w-full items-center justify-center mt-5">
          <textarea
            placeholder="Paste doc content here ..."
            rows={6}
            className={`block w-full md:w-[650px] rounded-md border ${darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-gray-300 bg-gray-100 text-gray-900"}
              p-2 text-sm shadow-lg font-medium focus:border-gray-500 focus:outline-none focus:ring-0`}
            onChange={(e) => setValue(e.target.value)}
          ></textarea>

          {value?.length > 0 && !submitting && (
            <button
              className="mt-5 bg-blue-500 px-5 py-2 text-white text-md font-cursor-pointer rounded-md"
              onClick={handlesubmit}
            >
              Submit
            </button>
          )}

          {/* File Upload Area */}
          <div className="flex flex-col items-center justify-center mt-6">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              id="file-upload"
              onChange={handleSubmitPDF}
            />
            <label
              htmlFor="file-upload"
              className="mt-4 bg-cyan-600 px-4 py-2 rounded-md cursor-pointer text-white"
            >
              Upload PDF for Summary
            </label>
          </div>

          {submitting && (
            <p className="mt-4 text-gray-400">Processing, please wait...</p>
          )}
        </div>

        {/* Display Summarized Data */}
        {data?.length > 0 && (
          <div className="mt-6 p-4">
            <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Summarized Texts:</h2>
            <ul className="list-none mt-4 space-y-4">
              {data.map((txt, idx) => (
                <li
                  key={idx}
                  className={`p-4 rounded-md text-md shadow-md relative ${darkMode ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-900"}`}
                >
                  <span>{txt}</span>
                  <img
                    src={Delete}
                    className="absolute top-2 right-2 cursor-pointer w-6 h-6"
                    alt="delete"
                    onClick={() => handleDelete(txt)}
                  />
                  <button
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded"
                    onClick={() => handleCopy(txt)}
                  >
                    Copy
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isCopy && <p className="text-green-400 mt-3">Text copied to clipboard!</p>}
      </div>
    </div>
  );
}

export default App;
