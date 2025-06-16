// popup.js

console.log("popup.js loaded");

function getUserId(callback) {
  chrome.storage.local.get(['resume_optimizer_user_id'], function(result) {
    let userId = result.resume_optimizer_user_id;
    if (!userId) {
      userId = crypto.randomUUID();
      chrome.storage.local.set({resume_optimizer_user_id: userId}, function() {
        callback(userId);
      });
    } else {
      callback(userId);
    }
  });
}

function saveToHistory(jobUrl, pdfBlob) {
  getUserId(function(userId) {
    chrome.storage.local.get(['resume_optimizer_history'], function(result) {
      let history = result.resume_optimizer_history || [];
      // Create a blob URL for the PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);
      history.unshift({
        userId: userId,
        jobUrl: jobUrl,
        pdfUrl: pdfUrl,
        timestamp: new Date().toISOString()
      });
      // Limit history to last 10 items (optional)
      history = history.slice(0, 10);
      chrome.storage.local.set({resume_optimizer_history: history});
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const optimizeButton = document.getElementById('optimize');
  const statusDiv = document.getElementById('status');

  optimizeButton.addEventListener('click', function() {
    getUserId(function(userId) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const jobUrl = tabs[0].url;
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('job_url', jobUrl);

        fetch('http://localhost:5000/optimize', {
          method: 'POST',
          body: formData
        })
        .then(async response => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to optimize resume');
          }
          return response.blob();
        })
        .then(pdfBlob => {
          // Download the PDF
          const downloadUrl = URL.createObjectURL(pdfBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          downloadLink.download = 'optimized_resume.pdf';
          downloadLink.click();
          URL.revokeObjectURL(downloadUrl);
          showStatus('Resume optimized successfully!', 'success');
          saveToHistory(jobUrl, pdfBlob);
        })
        .catch(error => {
          showError(error.message);
        });
      });
    });
  });

  document.getElementById('openFullPage').addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('upload.html') });
  });

  function showError(message) {
    statusDiv.textContent = message;
    statusDiv.className = 'error';
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
  }
});
