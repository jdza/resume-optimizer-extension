// popup.js

console.log("popup.js loaded");

// Attach listener to button
document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("optimizeBtn");

  if (!button) {
    console.warn("Optimize Resume button not found!");
    return;
  }

  button.addEventListener("click", async () => {
    console.log("Optimize Resume button clicked!");

    // Get active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject script to get current page URL
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const jobUrl = window.location.href;

        try {
          const response = await fetch("http://127.0.0.1:5000/optimize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ job_url: jobUrl })
          });

          if (!response.ok) {
            alert("Error optimizing resume: " + response.statusText);
            return;
          }

          // Download .tex file
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = "updated_resume.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(blobUrl);

          alert("Resume downloaded as updated_resume.tex");
        } catch (err) {
          console.error("Error calling backend:", err);
          alert("Failed to connect to backend.");
        }
      }
    });
  });
});
