import { useState } from "react";
import "./style.css";
import axios from 'axios';
import * as XLSX from 'xlsx';

function App() {
  const [msg, setmsg] = useState("");
  const [emailList, setEmailList] = useState([]);
  const [status, setStatus] = useState(""); // "sending", "success", "error"

  function handlemsg(evt) {
    setmsg(evt.target.value);
  }

  function handlefile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
      const totalemail = rawData.map(function(item) { return item.A });
      setEmailList(totalemail);
    };
    reader.readAsBinaryString(file);
  }

  function send() {
    if (!msg) { alert("Please enter a message!"); return; }
    if (emailList.length === 0) { alert("Please upload an Excel file!"); return; }

    setStatus("sending");

    axios.post("/api/sendmail", { msg: msg, emailList: emailList })
      .then(res => {
        if (res.data.success) {
          setStatus("success");
        } else {
          setStatus("error");
          console.error("Server error:", res.data.error);
        }
      })
      .catch(err => {
        setStatus("error");
        console.error("Connection error: " + err);
      });
  }

  return (
    <div>
      <div id="header-1"><h1>Bulk Mail</h1></div>
      <div id="header-2"><h1>We can help your business with sending multiple emails at once</h1></div>
      <div id="header-3"><h1>Drag and Drop</h1></div>
      <div id="desc">
        <textarea
          id="text"
          value={msg}
          onChange={handlemsg}
          placeholder="Enter the Email text..."
        ></textarea>
        <input type="file" onChange={handlefile} />
        <div id="mailcount">
          <p>Total Emails in the file: {emailList.length}</p>
        </div>

        {status === "sending" && (
          <div className="status-box sending">
            ⏳ Sending emails... please wait
          </div>
        )}
        {status === "success" && (
          <div className="status-box success">
            ✅ All emails sent successfully!
          </div>
        )}
        {status === "error" && (
          <div className="status-box error">
            ❌ Failed to send. Check console for details.
          </div>
        )}

        <button
          className="sendbtn"
          onClick={send}
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending..." : "Send"}
        </button>
      </div>
      <div id="footer">
        <p>&copy; 2026 Bulk Mail App | Streamlining your outreach</p>
        <div className="footer-links">
          <span>Privacy Policy</span>
          <span>Contact Support</span>
        </div>
      </div>
    </div>
  );
}

export default App;