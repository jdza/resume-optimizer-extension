document.getElementById("optimizeBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeAndSend,
  });
});

async function scrapeAndSend() {
  const bodyText = document.body.innerText;
  const response = await fetch("http://127.0.0.1:5000/optimize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      resume_latex: "%HELLO LATEX%",
      job_description: bodyText
    })
  });

  const data = await response.text();
  alert("Resume optimized! Check console or backend logs.");
}

console.log("popup.js loaded");

document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("optimizeBtn");

  if (button) {
    button.addEventListener("click", function () {
      console.log("Optimize Resume button clicked!");
    });
  } else {
    console.warn("Button not found!");
  }
});
