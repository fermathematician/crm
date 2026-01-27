import { useEffect, useState } from "react";

function App() {
  const [mensagem, setMensagem] = useState<string>('');

  useEffect( () => {
    fetch('http://localhost:3000/')
      .then(response => response.json())
      .then(data => {
        setMensagem(data.message)
      })
      .catch(error => console.error("Erro ao conectar: ", error));
  }, []); // Colchetes garante que só rode uma vezz

  return (
    <div>
      <h2>{mensagem}</h2>
    </div>
  );
}

export default App;