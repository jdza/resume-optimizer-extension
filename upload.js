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

function renderHistory() {
  chrome.storage.local.get(['resume_optimizer_history'], function(result) {
    const history = result.resume_optimizer_history || [];
    const historyList = document.getElementById('history');
    historyList.innerHTML = '';
    if (history.length === 0) {
      historyList.innerHTML = '<li>No history yet.</li>';
      return;
    }
    history.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${item.jobUrl}" target="_blank">${item.jobUrl}</a>
        &nbsp;|&nbsp;
        <a href="${item.pdfUrl}" download="optimized_resume.pdf">Download PDF</a>
        <span style="color: #888; font-size: 0.9em;">(${new Date(item.timestamp).toLocaleString()})</span>
      `;
      historyList.appendChild(li);
    });
  });
}

function renderCurrentResume() {
  chrome.storage.local.get(['resume_optimizer_current_resume'], function(result) {
    const container = document.getElementById('currentResume');
    if (result.resume_optimizer_current_resume) {
      // Show a download link and a preview (first 10 lines)
      const text = result.resume_optimizer_current_resume;
      const blob = new Blob([text], {type: 'text/x-tex'});
      const url = URL.createObjectURL(blob);
      container.innerHTML = `
        <a href="${url}" download="resume.tex">Download Current Resume</a>
        <pre style="max-height:200px;overflow:auto;background:#f4f4f4;padding:8px;border-radius:4px;margin-top:8px;">${text.split('\n').slice(0,10).join('\n')}${text.split('\n').length > 10 ? '\n...' : ''}</pre>
      `;
    } else {
      container.innerHTML = '<span style="color: #888;">No resume uploaded yet.</span>';
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const uploadButton = document.getElementById('upload');
  const resumeInput = document.getElementById('resume');
  const statusDiv = document.getElementById('status');

  uploadButton.addEventListener('click', function() {
    const resumeFile = resumeInput.files[0];
    if (!resumeFile) {
      showError('Please select a resume file');
      return;
    }
    if (!resumeFile.name.endsWith('.tex')) {
      showError('Only .tex files are supported');
      return;
    }
    getUserId(function(userId) {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('user_id', userId);

      fetch('http://localhost:5000/upload_resume', {
        method: 'POST',
        body: formData
      })
      .then(async response => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload resume');
        }
        return response.json();
      })
      .then(() => {
        showStatus('Resume uploaded successfully!', 'success');
        const reader = new FileReader();
        reader.onload = function(e) {
          chrome.storage.local.set({resume_optimizer_current_resume: e.target.result}, function() {
            renderCurrentResume();
          });
        };
        reader.readAsText(resumeFile);
      })
      .catch(error => {
        showError(error.message);
      });
    });
  });

  renderHistory();
  renderCurrentResume();
  document.getElementById('clearHistory').addEventListener('click', function() {
    chrome.storage.local.set({resume_optimizer_history: []}, function() {
      renderHistory();
    });
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