const img = document.getElementById('live-img');
const status = document.getElementById('status');

// Change IP if needed
const socket = new WebSocket('ws://192.168.0.163:8080');

socket.onopen = () => {
  status.textContent = 'Connected to stream.';
};

socket.onmessage = (e) => {
  const blob = new Blob([e.data], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);
  img.src = url;

  img.onload = () => URL.revokeObjectURL(url);
};

socket.onerror = () => {
  status.textContent = 'Stream error.';
};

socket.onclose = () => {
  status.textContent = 'Stream disconnected.';
};
