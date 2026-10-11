document.querySelectorAll('input[name="country"]').forEach(input=>input.addEventListener('change',()=>{
  document.getElementById('country-status').textContent=`Ваш выбор — ${input.value}. Он не отправляется организатору: предзапись ещё не открыта.`;
}));
