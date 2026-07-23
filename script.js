const status = document.getElementById('status');

if (status) {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 12) {
    status.textContent  = 'Buenos días :)';
  } else if (hour < 19) {
    status.textContent  = 'Buenas tardes :D';
  } else {
    status.textContent  = 'Buenas noches :]';
  }
}
