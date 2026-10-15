import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiSend,
  FiMail,
  FiDownload,
  FiFileText,
  FiEye,
  FiCheck,
} from "react-icons/fi";
import { AudioLines } from "lucide-react";
import {
  determineActionFromVoice,
  executeAgentAction,
} from "../../services/voiceAgentService";
import {
  executeUniversalReportWorkflow,
  downloadFile,
} from "../../services/mailService";
import "./VoiceAgent.css";

const QUICK_TEST_COMMANDS = [
  "Candidate Roster",
  "Billing & Invoices",
  "Job Pipeline",
  "Interview Pipeline",
  "Toggle Theme",
  "Platform Settings",
];

export default function VoiceAgent({
  onNavigateFallback,
  onToggleTheme,
  onSignOut,
  onToggleSidebar,
}) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle"); // 'idle' | 'listening' | 'processing' | 'success' | 'error'
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleTitle, setBubbleTitle] = useState("");
  const [bubbleMessage, setBubbleMessage] = useState("");
  const [textInput, setTextInput] = useState("");
  const [recipientEmail, setRecipientEmail] = useState(() => {
    return (
      (typeof window !== "undefined" &&
        window.localStorage.getItem("aifagen_recipient_email")) ||
      ""
    );
  });
  const [lastGeneratedReport, setLastGeneratedReport] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const statusRef = useRef("idle");
  const recognitionRef = useRef(null);
  const dismissTimeoutRef = useRef(null);
  const transcriptAccumulatorRef = useRef("");
  const hasProcessedRef = useRef(false);

  const updateStatus = (newStatus) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  };

  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const scheduleBubbleDismiss = (delayMs = 4000) => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }
    dismissTimeoutRef.current = setTimeout(() => {
      setBubbleVisible(false);
      updateStatus("idle");
    }, delayMs);
  };

  const handleProcessTranscript = async (finalText) => {
    const textToProcess = (finalText || "").trim();
    if (!textToProcess) {
      updateStatus("error");
      setBubbleTitle("No Speech Heard");
      setBubbleMessage("Didn't catch any words. Please click the mic and try again.");
      scheduleBubbleDismiss(3000);
      return;
    }

    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    updateStatus("processing");
    setBubbleTitle("Analyzing Command");
    setBubbleMessage(`“${textToProcess}”`);
    setBubbleVisible(true);

    try {
      const decision = await determineActionFromVoice(textToProcess);

      // Handle Universal Email Dispatch Tool Action
      if (decision && decision.action === "SEND_EMAIL") {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const targetEmail =
          decision.toEmail ||
          textToProcess.match(emailRegex)?.[0] ||
          textInput.match(emailRegex)?.[0] ||
          recipientEmail.trim() ||
          localStorage.getItem("aifagen_recipient_email") ||
          "";

        if (!targetEmail) {
          updateStatus("error");
          setBubbleTitle("Recipient Email Required");
          setBubbleMessage(
            "Please provide your email in the 'Recipient Email' input section below, then ask again or tap any Report chip.",
          );
          setBubbleVisible(true);
          setTimeout(() => {
            const inputEl = document.getElementById("voice-recipient-email-input");
            if (inputEl) {
              inputEl.focus();
              inputEl.classList.add("highlight-input");
              setTimeout(() => inputEl.classList.remove("highlight-input"), 1500);
            }
          }, 200);
          return;
        }

        // Save email for session and persistence
        if (targetEmail !== recipientEmail) {
          setRecipientEmail(targetEmail);
          try {
            localStorage.setItem("aifagen_recipient_email", targetEmail);
          } catch {}
        }

        updateStatus("processing");
        setBubbleTitle("Analyzing Data & Generating Report");
        setBubbleMessage(
          `Analyzing portal JS records for "${decision.query || textToProcess}", preparing styled HTML email, Excel and PDF, then dispatching via Brevo to ${targetEmail}...`,
        );

        try {
          const reportResult = await executeUniversalReportWorkflow({
            query: decision.query || textToProcess,
            toEmail: targetEmail,
          });

          // Check if data was found or if no data matched
          if (!reportResult.found) {
            updateStatus("error");
            setBubbleTitle("No Data Found");
            setBubbleMessage(
              reportResult.message || `No data found matching "${textToProcess}" in portal records.`,
            );
            return;
          }

          setLastGeneratedReport(reportResult);

          if (reportResult.success) {
            updateStatus("success");
            setBubbleTitle("Report Emailed Successfully");
            setBubbleMessage(
              `${reportResult.title || "Report"} (${reportResult.recordsCount} records) emailed to ${targetEmail} via Brevo! Download your attachments below:`,
            );
          } else {
            const errStr = reportResult.emailError?.message || "";
            const isIpErr =
              errStr.includes("authorised_ips") ||
              errStr.includes("Unauthorized IP") ||
              errStr.includes("525");

            updateStatus("error");
            setBubbleTitle(isIpErr ? "Brevo IP Note" : "Email Notification");
            setBubbleMessage(
              isIpErr
                ? `Brevo API requires authorising your IP at https://app.brevo.com/security/authorised_ips. Your downloadable Excel & PDF reports are ready below!`
                : `Could not complete Brevo delivery (${errStr}). Your downloadable Excel & PDF reports are ready below!`,
            );
          }
        } catch (mailErr) {
          console.error("Mail workflow error:", mailErr);
          updateStatus("error");
          setBubbleTitle("Report Generation Notice");
          setBubbleMessage(
            mailErr.message || "Failed to complete email workflow.",
          );
        }
        return;
      }

      // Handle Standard Navigation and Control Actions
      const isRecognized =
        decision &&
        decision.action !== "UNKNOWN" &&
        decision.type !== "UNKNOWN";

      if (isRecognized) {
        executeAgentAction(decision, {
          navigate,
          onNavigateFallback,
          onToggleTheme,
          onSignOut,
          onToggleSidebar,
        });

        updateStatus("success");
        setBubbleTitle(
          (decision.action || decision.type) === "NAVIGATE"
            ? "Navigating"
            : "Action Executed",
        );
        setBubbleMessage(decision.feedback || "Command completed successfully.");
        scheduleBubbleDismiss(3500);
      } else {
        updateStatus("error");
        setBubbleTitle("Command Unrecognized");
        setBubbleMessage(
          decision?.feedback ||
            "Could not match intent to a portal action or report tool. Please try again.",
        );
        scheduleBubbleDismiss(4500);
      }
    } catch (err) {
      console.error("Voice execution error:", err);
      updateStatus("error");
      setBubbleTitle("Voice Agent Error");
      setBubbleMessage("Failed to process command. Please try again.");
      scheduleBubbleDismiss(4000);
    }
  };

  const toggleListening = () => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    // If currently listening, clicking again finishes and executes spoken text
    if (statusRef.current === "listening") {
      const currentText = transcriptAccumulatorRef.current.trim();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (currentText && !hasProcessedRef.current) {
        hasProcessedRef.current = true;
        handleProcessTranscript(currentText);
      } else {
        updateStatus("idle");
        setBubbleVisible(false);
      }
      return;
    }

    // Check browser Web Speech API availability
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      updateStatus("error");
      setBubbleVisible(true);
      setBubbleTitle("Speech API Unavailable");
      setBubbleMessage(
        "Web Speech API is not supported in this browser. Please use Chrome or Edge.",
      );
      scheduleBubbleDismiss(5000);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      transcriptAccumulatorRef.current = "";
      hasProcessedRef.current = false;
      updateStatus("listening");
      setBubbleVisible(true);
      setBubbleTitle("Listening...");
      setBubbleMessage(
        "Speak command, e.g. 'Mail me last 7 days interview reports', 'Go to Candidate Roster'...",
      );

      recognition.onstart = () => {
        updateStatus("listening");
        setBubbleVisible(true);
        setBubbleTitle("Listening...");
        setBubbleMessage(
          "Speak command, e.g. 'Mail me last 7 days interview reports'...",
        );
      };

      recognition.onresult = (event) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        const clean = fullTranscript.trim();
        if (clean) {
          transcriptAccumulatorRef.current = clean;
          setBubbleMessage(`“${clean}”`);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          updateStatus("error");
          setBubbleTitle("No Speech Heard");
          setBubbleMessage("Didn't hear any speech. Click the mic to try again.");
          scheduleBubbleDismiss(3000);
        } else if (event.error === "not-allowed") {
          updateStatus("error");
          setBubbleTitle("Microphone Blocked");
          setBubbleMessage(
            "Microphone permission was denied. Please allow microphone access in your browser address bar.",
          );
          scheduleBubbleDismiss(6000);
        } else if (event.error === "network") {
          updateStatus("error");
          setBubbleTitle("Network Error");
          setBubbleMessage("Speech recognition service network error.");
          scheduleBubbleDismiss(3500);
        } else if (event.error !== "aborted") {
          updateStatus("error");
          setBubbleTitle("Recognition Error");
          setBubbleMessage(`Speech error: ${event.error}`);
          scheduleBubbleDismiss(3500);
        }
      };

      recognition.onend = () => {
        if (statusRef.current === "listening") {
          const text = transcriptAccumulatorRef.current.trim();
          if (text && !hasProcessedRef.current) {
            hasProcessedRef.current = true;
            handleProcessTranscript(text);
          } else if (!text) {
            updateStatus("idle");
            setBubbleTitle("No Speech Detected");
            setBubbleMessage("Didn't detect any words. Click the mic to try again.");
            scheduleBubbleDismiss(2500);
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      updateStatus("error");
      setBubbleVisible(true);
      setBubbleTitle("Mic Activation Failed");
      setBubbleMessage("Could not initialize microphone. Please check permissions.");
      scheduleBubbleDismiss(3500);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const cmd = textInput.trim();
    setTextInput("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    hasProcessedRef.current = true;
    handleProcessTranscript(cmd);
  };

  const handleChipClick = (cmd) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    hasProcessedRef.current = true;
    handleProcessTranscript(cmd);
  };

  const handleSendReportClick = (query) => {
    const targetQuery =
      query ||
      "just mail me the last 7 days interview reports to my mail i have given the mail in input section";

    if (!recipientEmail.trim()) {
      updateStatus("error");
      setBubbleTitle("Recipient Email Required");
      setBubbleMessage(
        "Please type your email into the Recipient Email input below, then click this button.",
      );
      setBubbleVisible(true);
      setTimeout(() => {
        const inputEl = document.getElementById("voice-recipient-email-input");
        if (inputEl) {
          inputEl.focus();
          inputEl.classList.add("highlight-input");
          setTimeout(() => inputEl.classList.remove("highlight-input"), 1500);
        }
      }, 200);
      return;
    }

    handleChipClick(targetQuery);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "listening":
        return <AudioLines className="bubble-icon pulse" size={17} strokeWidth={2.2} />;
      case "processing":
        return <FiLoader className="bubble-icon spin" size={17} />;
      case "success":
        return <FiCheckCircle className="bubble-icon" size={17} />;
      case "error":
        return <FiAlertCircle className="bubble-icon" size={17} />;
      default:
        return <AudioLines className="bubble-icon" size={17} strokeWidth={2.2} />;
    }
  };

  return (
    <div className="voice-agent-dock" aria-label="Voice Navigation Assistant">
      {/* Feedback Status Bubble */}
      {bubbleVisible && (
        <div
          className={`voice-status-bubble status-${status}`}
          role="status"
          aria-live="polite"
        >
          {getStatusIcon()}
          <div className="bubble-text">
            <span className="bubble-title">{bubbleTitle}</span>
            <p className="bubble-msg">{bubbleMessage}</p>

            {/* Generated Report Download & Preview Cards */}
            {lastGeneratedReport && (
              <div className="voice-report-card">
                <div className="voice-report-header">
                  <span className="voice-report-label">
                    {lastGeneratedReport.title || "Generated Files"}
                  </span>
                  <span className="voice-report-badge">
                    {lastGeneratedReport.topic || "Analysis Report"}
                  </span>
                </div>
                <div className="voice-report-actions">
                  <button
                    type="button"
                    className="voice-report-btn excel-btn"
                    onClick={() => {
                      downloadFile(
                        lastGeneratedReport.excelFilename,
                        lastGeneratedReport.excelContent,
                        "text/csv;charset=utf-8;",
                      );
                    }}
                    title="Download Excel Spreadsheet (.csv)"
                  >
                    <FiDownload size={12} />
                    <span>Excel (.csv)</span>
                  </button>

                  <button
                    type="button"
                    className="voice-report-btn pdf-btn"
                    onClick={() => {
                      if (lastGeneratedReport.pdfDoc?.save) {
                        lastGeneratedReport.pdfDoc.save(lastGeneratedReport.pdfFilename);
                      }
                    }}
                    title="Download Executive PDF Document"
                  >
                    <FiFileText size={12} />
                    <span>PDF Report</span>
                  </button>

                  <button
                    type="button"
                    className="voice-report-btn preview-btn"
                    onClick={() => setShowPreviewModal(true)}
                    title="Preview Styled HTML Email"
                  >
                    <FiEye size={12} />
                    <span>View HTML</span>
                  </button>
                </div>
              </div>
            )}

            {/* Dedicated Recipient Email Input Section */}
            <div className="voice-email-input-section">
              <div className="voice-email-label-row">
                <label
                  htmlFor="voice-recipient-email-input"
                  className="voice-email-label"
                >
                  <FiMail size={12} className="voice-label-icon" />
                  <span>Recipient Email:</span>
                </label>
                {recipientEmail.includes("@") && (
                  <span className="voice-email-saved-tag">
                    <FiCheck size={10} /> Saved
                  </span>
                )}
              </div>
              <input
                id="voice-recipient-email-input"
                type="email"
                placeholder="Enter email to receive reports..."
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  try {
                    localStorage.setItem("aifagen_recipient_email", e.target.value);
                  } catch {}
                }}
                className="voice-email-input"
              />
            </div>

            {/* Quick trigger chips for effortless testing and discovery */}
            <div className="voice-chips-row">
              <button
                type="button"
                className="voice-quick-chip mail-chip"
                onClick={() =>
                  handleSendReportClick(
                    "just mail me the last 7 days interview reports to my mail i have given the mail in input section",
                  )
                }
                title="Email 7-day interview reports"
              >
                ✉️ 7-Day Interview Report
              </button>

              <button
                type="button"
                className="voice-quick-chip mail-chip"
                onClick={() =>
                  handleSendReportClick(
                    "mail me the failed payments report to my mail i have given the mail in input section",
                  )
                }
                title="Email failed payments report"
              >
                💳 Failed Payments
              </button>

              <button
                type="button"
                className="voice-quick-chip mail-chip"
                onClick={() =>
                  handleSendReportClick(
                    "send me candidate roster for premium users to my mail i have given the mail in input section",
                  )
                }
                title="Email premium candidate roster"
              >
                👥 Candidate Roster
              </button>

              <button
                type="button"
                className="voice-quick-chip mail-chip"
                onClick={() =>
                  handleSendReportClick(
                    "email me all active job openings to my mail i have given the mail in input section",
                  )
                }
                title="Email active job openings report"
              >
                💼 Active Jobs
              </button>

              <button
                type="button"
                className="voice-quick-chip mail-chip"
                onClick={() =>
                  handleSendReportClick(
                    "send AI cost and token consumption analysis to my mail i have given the mail in input section",
                  )
                }
                title="Email AI cost & token telemetry"
              >
                🤖 AI Token Spend
              </button>

              {QUICK_TEST_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  className="voice-quick-chip"
                  onClick={() => handleChipClick(cmd)}
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Manual test command input */}
            <form className="voice-inline-form" onSubmit={handleManualSubmit}>
              <input
                type="text"
                placeholder="Or type voice command..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="voice-inline-input"
              />
              <button
                type="submit"
                className="voice-inline-send-btn"
                title="Send test command"
                disabled={!textInput.trim()}
              >
                <FiSend size={11} />
              </button>
            </form>
          </div>
          <button
            type="button"
            className="bubble-close-btn"
            onClick={() => {
              setBubbleVisible(false);
              updateStatus("idle");
            }}
            aria-label="Dismiss message"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Floating Action Button with Modern Audio Frequency Waveform Symbol */}
      <button
        type="button"
        className={`voice-mic-btn ${status === "listening" ? "listening" : ""} ${
          status === "processing" ? "processing" : ""
        }`}
        onClick={toggleListening}
        title={
          status === "listening"
            ? "Listening... Click to finish or cancel"
            : status === "processing"
            ? "Analyzing voice command..."
            : "Voice Agent (Speak commands or request email reports)"
        }
        aria-label="Activate voice navigation commands"
      >
        {status === "listening" ? (
          <>
            <span className="mic-wave" />
            <AudioLines className="agent-symbol-icon listening-wave" size={20} strokeWidth={2.4} />
          </>
        ) : status === "processing" ? (
          <FiLoader className="agent-symbol-icon spin" size={20} />
        ) : (
          <AudioLines className="agent-symbol-icon" size={20} strokeWidth={2.2} />
        )}
      </button>

      {/* HTML Email Digest Preview Modal */}
      {showPreviewModal && lastGeneratedReport && (
        <div
          className="voice-email-preview-backdrop"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="voice-email-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="voice-preview-header">
              <div className="voice-preview-title-group">
                <h3>AIFaGen Email Report Preview</h3>
                <p>
                  To: <strong>{lastGeneratedReport.toEmail}</strong> · Status:{" "}
                  <span
                    className={
                      lastGeneratedReport.success
                        ? "preview-status-success"
                        : "preview-status-notice"
                    }
                  >
                    {lastGeneratedReport.success
                      ? "Dispatched via Brevo"
                      : "Generated & Downloadable"}
                  </span>
                </p>
              </div>
              <div className="voice-preview-header-actions">
                <button
                  type="button"
                  className="preview-download-btn excel"
                  onClick={() => {
                    downloadFile(
                      lastGeneratedReport.excelFilename,
                      lastGeneratedReport.excelContent,
                      "text/csv;charset=utf-8;",
                    );
                  }}
                >
                  <FiDownload size={13} /> Excel (.csv)
                </button>
                <button
                  type="button"
                  className="preview-download-btn pdf"
                  onClick={() => {
                    lastGeneratedReport.pdfDoc?.save(
                      lastGeneratedReport.pdfFilename,
                    );
                  }}
                >
                  <FiFileText size={13} /> PDF Report
                </button>
                <button
                  type="button"
                  className="preview-close-btn"
                  onClick={() => setShowPreviewModal(false)}
                  aria-label="Close Preview"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>
            <div className="voice-preview-body">
              <iframe
                title="Email HTML Preview"
                srcDoc={lastGeneratedReport.htmlContent}
                className="voice-preview-iframe"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
