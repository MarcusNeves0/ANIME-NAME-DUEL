import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { Copy, Sword, Shield, Crown, Loader2, Gamepad2, Bot, ArrowLeft, Check, RefreshCw } from 'lucide-react';

// --- ATENÇÃO ---
// A configuração do Firebase é lida de variáveis de ambiente para desenvolvimento local
// ou injetada dinamicamente pela plataforma.
let firebaseConfig;

if (typeof window.__firebase_config !== 'undefined') {
  // Prioridade 1: Ambiente da plataforma (Canvas)
  firebaseConfig = JSON.parse(window.__firebase_config);
} else if (process.env.REACT_APP_PROJECT_ID) {
  // Prioridade 2: Ambiente de desenvolvimento local (lê do arquivo .env)
  firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID
  };
} else {
  // Fallback de segurança para evitar erros de tela branca
  console.error("CONFIGURAÇÃO DO FIREBASE NÃO ENCONTRADA. Verifique se o arquivo .env está na raiz do projeto e se as variáveis começam com REACT_APP_");
  firebaseConfig = {
    apiKey: "dummy",
    authDomain: "dummy.firebaseapp.com",
    projectId: "dummy-project", // Evita o crash de "projectId not provided"
    storageBucket: "dummy.appspot.com",
    messagingSenderId: "dummy",
    appId: "dummy"
  };
}


const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Lista de animes populares pré-definida
const popularAnimeList = [
  { id: 20, name: "Naruto" },
  { id: 813, name: "Dragon Ball Z" },
  { id: 21, name: "One Piece" },
  { id: 16498, name: "Attack on Titan" },
  { id: 52299, name: "Solo Leveling" },
  { id: 40748, name: "Jujutsu Kaisen" },
  { id: 44511, name: "Chainsaw Man" },
  { id: 38000, name: "Demon Slayer: Kimetsu no Yaiba" },
  { id: 5231, name: "Inazuma Eleven" },
];

// --- Componentes de Estilo e UI ---

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
    
    body {
      margin: 0;
      font-family: 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .main-container {
      min-height: 100vh;
      background: linear-gradient(to bottom right, #111827, #1e293b);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .card {
      width: 100%;
      background-color: rgba(31, 41, 55, 0.5);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(55, 65, 81, 0.5);
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      padding: 1.5rem;
      text-align: center;
    }
    
    .card > * + * {
        margin-top: 1.5rem;
    }

    .card-title {
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(to right, #ffffff, #93c5fd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .card-subtitle {
      color: #9ca3af;
      margin-top: 0.5rem !important;
    }

    .button {
      width: 100%;
      font-weight: 700;
      padding: 0.6rem 1rem;
      border-radius: 0.5rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .button:hover {
        transform: translateY(-2px);
    }
    
    .button:disabled {
        background-color: #4b5563 !important;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .button-green {
      background-color: #16a34a;
      color: white;
      box-shadow: 0 0 20px rgba(22, 163, 74, 0.3);
    }
    .button-green:hover {
      background-color: #22c55e;
    }

    .button-cyan {
      background-color: #0891b2;
      color: white;
      box-shadow: 0 0 20px rgba(8, 145, 178, 0.3);
    }
    .button-cyan:hover {
      background-color: #06b6d4;
    }
    
    .button-gray {
      background-color: #4b5563;
      color: white;
      box-shadow: 0 0 20px rgba(75, 85, 99, 0.3);
    }
    .button-gray:hover {
      background-color: #6b7280;
    }

    .input-field {
      width: 100%;
      padding: 0.6rem;
      background-color: rgba(55, 65, 81, 0.8);
      border: 2px solid #4b5563;
      border-radius: 0.5rem;
      color: white;
      transition: all 0.2s ease;
    }
    .input-field:focus {
      outline: none;
      border-color: #0891b2;
      box-shadow: 0 0 0 2px rgba(8, 145, 178, 0.5);
    }
    
    .back-button {
        position: absolute;
        top: 1rem;
        left: 1rem;
        color: #9ca3af;
        cursor: pointer;
        transition: color 0.2s ease;
    }
    .back-button:hover {
        color: white;
    }
    
    .loader {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
  `}</style>
);

const LetterPlaceholders = ({ name, revealedIndices = [] }) => {
  if (!name) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' }}>
      {name.split('').map((char, index) => (
        <span key={index} style={{
          display: 'inline-flex',
          width: '1.75rem',
          height: '2.25rem',
          borderRadius: '0.375rem',
          textAlign: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1.125rem',
          transition: 'all 0.3s ease',
          backgroundColor: revealedIndices.includes(index) ? 'rgba(56, 189, 248, 0.2)' : 'rgba(55, 65, 81, 0.5)',
          color: revealedIndices.includes(index) ? '#67e8f9' : '#9ca3af',
        }}>
          {char.match(/\s|[-.,]/) || revealedIndices.includes(index) ? char : '_'}
        </span>
      ))}
    </div>
  );
};

// Componente principal do jogo
export default function App() {
  const [gameMode, setGameMode] = useState('lobby'); // 'lobby', 'singleplayer', 'multiplayer'
  const [userId, setUserId] = useState(null);
  
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [joinGameId, setJoinGameId] = useState('');
  const [multiplayerGuess, setMultiplayerGuess] = useState('');

  const [singlePlayerState, setSinglePlayerState] = useState({
    status: 'loading',
    playerCharacter: null,
    aiCharacter: null,
    score: { player: 0, ai: 0 },
    playerGuess: '',
    aiGuess: '',
    playerIncorrectGuesses: 0,
    playerRevealedIndices: [],
    aiRevealedIndices: [],
    currentPlayerTurn: 'player',
    round: 1,
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Lógica do jogo (sem alterações)
  useEffect(() => {
    const authenticate = async () => {
      try {
        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Firebase authentication failed:", err);
        setError("Falha na autenticação. Verifique suas chaves do Firebase se estiver rodando localmente.");
      }
    };
    authenticate();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (gameMode !== 'multiplayer' || !gameId || !userId) return;
    const gameRef = doc(db, "artifacts", appId, "public/data/games", gameId);
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState(data);
        if (data.status === 'waiting' && Object.keys(data.players).length === 2 && data.hostId === userId && !data.players[Object.keys(data.players)[0]].character) {
            fetchMultiplayerCharacters(gameId);
        }
      } else {
        setError("Jogo não encontrado."); setGameId(null); setGameState(null);
      }
    }, (err) => {
        console.error("Firestore Snapshot Error:", err); setError("Erro de permissão ao acessar o jogo."); setGameId(null);
    });
    return () => unsubscribe();
  }, [gameId, userId, gameMode]);

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallback: Não foi possível copiar', err);
    }
    document.body.removeChild(textArea);
  };

  const normalize = (str) => str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
  const isCorrect = (guessStr, nameStr) => {
      if (!guessStr || !nameStr) return false;
      const normalizedGuess = normalize(guessStr);
      const normalizedName = normalize(nameStr);
      if (normalizedName.includes(',')) {
          const [last, first] = normalizedName.split(',').map(s => s.trim());
          return normalizedGuess === `${first} ${last}` || normalizedGuess === `${last} ${first}`;
      }
      return normalizedGuess === normalizedName;
  }

  // --- LÓGICA DE SINGLE PLAYER ---
  const fetchSinglePlayerCharacters = async () => {
    setSinglePlayerState(prev => ({ ...prev, status: 'loading' }));
    try {
      const characters = [];
      const shuffledList = [...popularAnimeList].sort(() => 0.5 - Math.random());
      const animesForRound = shuffledList.slice(0, 2);

      for (const animeInfo of animesForRound) {
          const charactersResponse = await fetch(`https://api.jikan.moe/v4/anime/${animeInfo.id}/characters`);
          const charactersData = await charactersResponse.json();
          let mainCharacters = charactersData.data.filter(c => c.role === 'Main' && c.character.name.length > 2);
          if (mainCharacters.length === 0) mainCharacters = charactersData.data.filter(c => c.character.name.length > 2);
          if (mainCharacters.length > 0) {
              const randomCharacter = mainCharacters[Math.floor(Math.random() * mainCharacters.length)];
              characters.push({ name: randomCharacter.character.name, anime: animeInfo.name, animeId: animeInfo.id });
          }
      }

      if (characters.length < 2) throw new Error("Não foi possível buscar 2 personagens distintos.");

      setSinglePlayerState(prev => ({
        ...prev,
        status: 'playing',
        playerCharacter: characters[0],
        aiCharacter: characters[1],
        playerGuess: '',
        aiGuess: '',
        playerIncorrectGuesses: 0,
        playerRevealedIndices: [],
        aiRevealedIndices: [],
        currentPlayerTurn: prev.round % 2 !== 0 ? 'player' : 'ai',
      }));
    } catch (err) {
      console.error("Failed to fetch characters for SP:", err);
      setError("Não foi possível buscar personagens. Tente novamente.");
      setGameMode('lobby');
    }
  };

  const handleStartSinglePlayer = () => {
    setGameMode('singleplayer');
    fetchSinglePlayerCharacters();
  };

  const handleSinglePlayerGuess = (e) => {
    e.preventDefault();
    const { playerGuess, aiCharacter, playerIncorrectGuesses, aiRevealedIndices } = singlePlayerState;
    if (!playerGuess.trim()) return;

    if (isCorrect(playerGuess, aiCharacter.name)) {
        setSinglePlayerState(prev => ({ ...prev, status: 'player_wins', score: { ...prev.score, player: prev.score.player + 1 } }));
    } else {
        const newIncorrectGuesses = playerIncorrectGuesses + 1;
        let newRevealedIndices = [...aiRevealedIndices];
        if (newIncorrectGuesses % 3 === 0) {
            const unrevealed = aiCharacter.name.split('').map((c, i) => i).filter(i => !newRevealedIndices.includes(i) && !aiCharacter.name[i].match(/\s|[-.,]/));
            if (unrevealed.length > 0) {
                const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
                newRevealedIndices.push(randomIndex);
            }
        }
        setSinglePlayerState(prev => ({ ...prev, playerIncorrectGuesses: newIncorrectGuesses, aiRevealedIndices: newRevealedIndices, currentPlayerTurn: 'ai' }));
    }
  };

  const handleNextSinglePlayerRound = () => {
    setSinglePlayerState(prev => ({
        ...prev,
        round: prev.round + 1,
    }));
    fetchSinglePlayerCharacters();
  };

  // Efeito para o turno da IA
  useEffect(() => {
    if (gameMode === 'singleplayer' && singlePlayerState.status === 'playing' && singlePlayerState.currentPlayerTurn === 'ai') {
      const aiTurn = async () => {
        try {
          // A IA busca todos os personagens do anime correto
          const charactersResponse = await fetch(`https://api.jikan.moe/v4/anime/${singlePlayerState.playerCharacter.animeId}/characters`);
          const charactersData = await charactersResponse.json();
          const allCharactersInAnime = charactersData.data.map(c => c.character.name);
          
          // A IA faz um palpite aleatório de um personagem do anime
          const aiGuess = allCharactersInAnime[Math.floor(Math.random() * allCharactersInAnime.length)];

          if (isCorrect(aiGuess, singlePlayerState.playerCharacter.name)) {
            setSinglePlayerState(prev => ({ ...prev, status: 'ai_wins', aiGuess, score: { ...prev.score, ai: prev.score.ai + 1 } }));
          } else {
            setSinglePlayerState(prev => ({ ...prev, aiGuess, currentPlayerTurn: 'player' }));
          }
        } catch (err) {
          console.error("AI failed to fetch characters:", err);
          // Se a API falhar, a IA passa o turno de volta para o jogador
          setSinglePlayerState(prev => ({ ...prev, currentPlayerTurn: 'player' }));
        }
      };
      // Adiciona um delay para simular o "pensamento" da IA
      const timer = setTimeout(aiTurn, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameMode, singlePlayerState.status, singlePlayerState.currentPlayerTurn, singlePlayerState.playerCharacter]);


  // --- LÓGICA DE MULTIPLAYER ---
  const fetchMultiplayerCharacters = async (currentGameId) => {
    const gameRef = doc(db, "artifacts", appId, "public/data/games", currentGameId);
      try {
        const charactersToAssign = [];
        const shuffledList = [...popularAnimeList].sort(() => 0.5 - Math.random());
        const animesForRound = shuffledList.slice(0, 2);

        for (const animeInfo of animesForRound) {
            const charactersResponse = await fetch(`https://api.jikan.moe/v4/anime/${animeInfo.id}/characters`);
            const charactersData = await charactersResponse.json();
            let mainCharacters = charactersData.data.filter(c => c.role === 'Main' && c.character.name.length > 2);
            if (mainCharacters.length === 0) mainCharacters = charactersData.data.filter(c => c.character.name.length > 2);

            if (mainCharacters.length > 0) {
                const randomCharacter = mainCharacters[Math.floor(Math.random() * mainCharacters.length)];
                charactersToAssign.push({ name: randomCharacter.character.name, anime: animeInfo.name });
            }
        }

        if (charactersToAssign.length < 2) throw new Error("Não foi possível buscar 2 personagens distintos da lista.");
        
        const gameSnap = await getDoc(gameRef);
        if(!gameSnap.exists()) return;

        const currentPlayers = gameSnap.data().players;
        const playerIds = Object.keys(currentPlayers);
        const updatedPlayers = {
            [playerIds[0]]: { ...currentPlayers[playerIds[0]], character: charactersToAssign[0], incorrectGuessesByOpponent: 0, revealedIndices: [] },
            [playerIds[1]]: { ...currentPlayers[playerIds[1]], character: charactersToAssign[1], incorrectGuessesByOpponent: 0, revealedIndices: [] },
        };
        await updateDoc(gameRef, { players: updatedPlayers, status: 'playing', roundWinner: null, guesses: {}, currentPlayerTurn: gameSnap.data().hostId });
      } catch (err) {
          console.error("Failed to start game:", err);
          await updateDoc(gameRef, { status: 'error', errorMessage: 'Falha ao buscar personagens. O host pode tentar novamente.' });
      }
  };
  const handleCreateGame = async () => {
    if (!userId) { setError("Você precisa estar autenticado para criar um jogo."); return; }
    setIsLoading(true);
    setGameMode('multiplayer');
    const newGameId = `game-${Math.random().toString(36).substr(2, 9)}`;
    const gameRef = doc(db, "artifacts", appId, "public/data/games", newGameId);
    try {
      await setDoc(gameRef, { gameId: newGameId, hostId: userId, status: 'waiting', players: { [userId]: { score: 0 } }, round: 1, createdAt: new Date() });
      setGameId(newGameId);
    } catch (err) { console.error(err); setError("Falha ao criar o jogo."); } finally { setIsLoading(false); }
  };
  const handleJoinGame = async () => {
    if (!joinGameId || !userId) return;
    setIsLoading(true);
    setGameMode('multiplayer');
    const gameRef = doc(db, "artifacts", appId, "public/data/games", joinGameId);
    try {
      const gameSnap = await getDoc(gameRef);
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        if (Object.keys(gameData.players).length < 2) {
          await updateDoc(gameRef, { [`players.${userId}`]: { score: 0 } });
          setGameId(joinGameId);
        } else { setError("Esta sala de jogo já está cheia."); setGameMode('lobby');}
      } else { setError("Jogo não encontrado com este ID."); setGameMode('lobby');}
    } catch (err) { console.error(err); setError("Falha ao entrar no jogo."); setGameMode('lobby');} finally { setIsLoading(false); }
  };
  const handleMultiplayerGuess = async (e) => {
    e.preventDefault();
    if (!multiplayerGuess.trim() || !gameState || gameState.status !== 'playing' || gameState.currentPlayerTurn !== userId) return;
    
    const opponentId = Object.keys(gameState.players).find(id => id !== userId);
    const opponentInfo = gameState.players[opponentId];
    const opponentCharacterName = opponentInfo.character.name;

    if (isCorrect(multiplayerGuess, opponentCharacterName)) {
      const newScore = (gameState.players[userId].score || 0) + 1;
      await updateDoc(doc(db, "artifacts", appId, "public/data/games", gameId), { status: 'roundOver', roundWinner: userId, [`players.${userId}.score`]: newScore });
    } else {
      const newIncorrectGuesses = (opponentInfo.incorrectGuessesByOpponent || 0) + 1;
      let newRevealedIndices = opponentInfo.revealedIndices || [];
      if (newIncorrectGuesses % 3 === 0) {
          const unrevealed = opponentCharacterName.split('').map((c, i) => i).filter(i => !newRevealedIndices.includes(i) && !opponentCharacterName[i].match(/\s|[-.,]/));
          if (unrevealed.length > 0) {
              const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
              newRevealedIndices.push(randomIndex);
          }
      }
      await updateDoc(doc(db, "artifacts", appId, "public/data/games", gameId), { 
          [`guesses.${userId}`]: multiplayerGuess,
          [`players.${opponentId}.incorrectGuessesByOpponent`]: newIncorrectGuesses,
          [`players.${opponentId}.revealedIndices`]: newRevealedIndices,
          currentPlayerTurn: opponentId, // Passa o turno para o oponente
      });
      setMultiplayerGuess('');
    }
  };
  const handleNextRound = async () => {
    if (!gameState || gameState.hostId !== userId) return;
    
    const playerIds = Object.keys(gameState.players);
    const opponentId = playerIds.find(id => id !== gameState.hostId);
    const newRoundNumber = gameState.round + 1;
    // Alterna quem começa: host em rounds ímpares, oponente em pares.
    const nextTurnPlayer = newRoundNumber % 2 !== 0 ? gameState.hostId : opponentId;

    // Reinicia os dados dos jogadores para a nova rodada, mantendo a pontuação
    const playersReset = {};
    for (const pId of playerIds) {
        playersReset[pId] = {
            score: gameState.players[pId].score
        };
    }

    await updateDoc(doc(db, "artifacts", appId, "public/data/games", gameId), { 
        status: 'waiting', 
        round: newRoundNumber, 
        roundWinner: null,
        currentPlayerTurn: nextTurnPlayer,
        players: playersReset, // Usa o objeto de jogadores resetado
        guesses: {},
        errorMessage: null,
    });
  };
  
  const goBackToLobby = () => {
    setGameMode('lobby');
    setGameState(null);
    setGameId(null);
    setError('');
  }

  // --- RENDERIZAÇÃO ---
  const renderLoading = () => (
    <div className="main-container">
      <Loader2 className="loader" size={48} style={{color: '#0891b2'}}/>
      <p style={{marginTop: '1rem', fontSize: '1.125rem', color: '#9ca3af'}}>Carregando...</p>
    </div>
  );

  const renderLobby = () => (
    <>
      <GlobalStyles />
      <div className="main-container">
        <div className="card" style={{maxWidth: '28rem'}}>
            <Gamepad2 size={64} style={{margin: '0 auto', color: '#0891b2', filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.5))'}} />
            <h1 className="card-title">Duelo de Nomes</h1>
            <p className="card-subtitle">Escolha seu modo de jogo.</p>
            
            {error && <p style={{color: '#f87171', backgroundColor: 'rgba(127, 29, 29, 0.5)', padding: '0.75rem', borderRadius: '0.5rem'}}>{error}</p>}
            
            <div style={{paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <button onClick={handleStartSinglePlayer} className="button button-green">
                    <Bot size={20}/> Jogar Contra a IA
                </button>
                <button onClick={handleCreateGame} className="button button-cyan">
                    Criar Jogo Online
                </button>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <input type="text" value={joinGameId} onChange={(e) => setJoinGameId(e.target.value)} placeholder="ID do jogo" className="input-field" style={{flexGrow: 1}}/>
                    <button onClick={handleJoinGame} className="button button-gray">
                        Entrar
                    </button>
                </div>
            </div>
        </div>
      </div>
    </>
  );

  const renderSinglePlayer = () => {
    const { status, playerCharacter, aiCharacter, score, playerGuess, aiGuess, playerRevealedIndices, aiRevealedIndices, currentPlayerTurn, round } = singlePlayerState;
    const isMyTurn = currentPlayerTurn === 'player';

    if (status === 'loading') {
        return (
          <>
            <GlobalStyles />
            <div className="main-container">
              <div className="card" style={{maxWidth: '28rem', position: 'relative'}}>
                  <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#67e8f9'}}>Iniciando Rodada...</h2>
                  <p className="card-subtitle">Buscando personagens para o duelo!</p>
                  <Loader2 className="loader" size={32} style={{margin: '1rem auto', color: '#0891b2'}} />
              </div>
            </div>
          </>
        );
    }

    return (
      <>
        <GlobalStyles />
        <div className="main-container">
            <div className="card" style={{maxWidth: '60rem', position: 'relative'}}>
                <button onClick={goBackToLobby} className="back-button"><ArrowLeft/></button>
                {/* Placar */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(17, 24, 39, 0.5)', borderRadius: '0.5rem', border: '1px solid #374151'}}>
                    <div style={{width: '40%'}}><p style={{fontSize: '0.875rem', color: '#67e8f9'}}>Você</p><p style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'white'}}>{score.player}</p></div>
                    <div style={{width: '20%'}}><p style={{fontSize: '1rem', fontWeight: 'bold', color: '#9ca3af'}}>Round {round}</p></div>
                    <div style={{width: '40%'}}><p style={{fontSize: '0.875rem', color: '#fca5a5'}}>IA</p><p style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'white'}}>{score.ai}</p></div>
                </div>

                {status === 'player_wins' || status === 'ai_wins' ? (
                    <div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', backgroundColor: 'rgba(17, 24, 39, 0.7)', borderRadius: '0.5rem', border: '1px solid #374151'}}>
                        <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #fcd34d, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Fim da Rodada!</h2>
                        {status === 'player_wins' ? <p style={{color: '#34d399', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}><Crown/> Você venceu!</p> : <p style={{color: '#f87171', fontSize: '1.125rem'}}>A IA venceu.</p>}
                        <div style={{textAlign: 'left', backgroundColor: 'rgba(55, 65, 81, 0.5)', padding: '1rem', borderRadius: '0.375rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                           <p>Seu personagem era: <span style={{fontWeight: 'bold', color: '#67e8f9'}}>{playerCharacter.name}</span></p>
                           <p>Personagem da IA: <span style={{fontWeight: 'bold', color: '#fca5a5'}}>{aiCharacter.name}</span></p>
                        </div>
                        <button onClick={handleNextSinglePlayerRound} className="button button-cyan" style={{marginTop: '1rem'}}>Próxima Rodada</button>
                    </div>
                ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                    {/* Painel de Ataque */}
                    <div style={{width: '100%', padding: '1rem', backgroundColor: 'rgba(17, 24, 39, 0.7)', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '2px solid', borderColor: isMyTurn ? '#0891b2' : 'rgba(8, 145, 178, 0.2)', boxShadow: isMyTurn ? '0 0 20px rgba(8, 145, 178, 0.3)' : 'none', transition: 'all 0.3s ease', opacity: isMyTurn ? 1 : 0.6}}>
                        <h3 style={{fontWeight: 'bold', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#67e8f9'}}><Sword size={20}/> SEU ATAQUE {isMyTurn && "(Sua vez)"}</h3>
                        <p style={{color: '#d1d5db', fontSize: '0.875rem'}}>Adivinhe o personagem da IA de:</p>
                        <p style={{fontSize: '1.25rem', fontWeight: '600', color: 'white'}}>{aiCharacter?.anime || '???'}</p>
                        <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50px'}}>
                            <LetterPlaceholders name={aiCharacter?.name} revealedIndices={aiRevealedIndices} />
                        </div>
                        <form onSubmit={handleSinglePlayerGuess} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem'}}>
                            <input type="text" value={playerGuess} onChange={(e) => setSinglePlayerState(prev => ({...prev, playerGuess: e.target.value}))} placeholder="Seu palpite..." className="input-field" disabled={!isMyTurn || status !== 'playing'}/>
                            <button type="submit" className="button button-cyan" disabled={!isMyTurn || status !== 'playing'}>Adivinhar</button>
                        </form>
                    </div>

                    {/* Painel de Defesa */}
                    <div style={{width: '100%', padding: '1rem', backgroundColor: 'rgba(17, 24, 39, 0.7)', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '2px solid', borderColor: !isMyTurn ? '#dc2626' : 'rgba(220, 38, 38, 0.2)', boxShadow: !isMyTurn ? '0 0 20px rgba(220, 38, 38, 0.3)' : 'none', transition: 'all 0.3s ease', opacity: !isMyTurn ? 1 : 0.6}}>
                        <h3 style={{fontWeight: 'bold', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#fca5a5'}}><Shield size={20}/> SUA DEFESA {!isMyTurn && "(Vez da IA)"}</h3>
                        <p style={{color: '#d1d5db', fontSize: '0.875rem'}}>A IA precisa adivinhar de:</p>
                        <p style={{fontSize: '1.25rem', fontWeight: '600', color: 'white'}}>{playerCharacter?.anime || '???'}</p>
                        <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50px'}}>
                             <LetterPlaceholders name={playerCharacter?.name} revealedIndices={playerRevealedIndices} />
                        </div>
                        <div style={{height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', paddingTop: '0.5rem'}}>
                            {aiGuess ? <p style={{fontSize: '0.875rem', color: '#9ca3af'}}>Último palpite da IA: <span style={{fontFamily: 'monospace', color: 'white', backgroundColor: 'rgba(55, 65, 81, 0.5)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}>{aiGuess}</span></p> : <p style={{fontSize: '0.875rem', color: '#6b7280'}}>Aguardando palpite da IA...</p>}
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
      </>
    );
  };


  const renderMultiplayer = () => {
    const playerIds = Object.keys(gameState.players);
    const opponentId = playerIds.find(id => id !== userId);
    const myInfo = gameState.players[userId];
    const opponentInfo = opponentId ? gameState.players[opponentId] : null;
    const isMyTurn = gameState.currentPlayerTurn === userId;

    if (gameState.status === 'waiting' && playerIds.length < 2) {
        return (
          <>
            <GlobalStyles />
            <div className="main-container">
              <div className="card" style={{maxWidth: '28rem', position: 'relative'}}>
                  <button onClick={goBackToLobby} className="back-button"><ArrowLeft/></button>
                  <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#67e8f9'}}>Aguardando Oponente...</h2>
                  <p className="card-subtitle">Compartilhe o ID do jogo com seu amigo:</p>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(17, 24, 39, 0.8)', borderRadius: '0.5rem', border: '1px solid #374151'}}>
                      <span style={{color: '#34d399', fontFamily: 'monospace', flexGrow: 1, textAlign: 'left'}}>{gameId}</span>
                      <button onClick={() => copyToClipboard(gameId)} style={{padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer'}}>
                          {copied ? <Check size={20} style={{color: '#34d399'}} /> : <Copy size={20} style={{color: '#9ca3af'}}/>}
                      </button>
                  </div>
                  <Loader2 className="loader" size={32} style={{margin: '1rem auto', color: '#0891b2'}} />
              </div>
            </div>
          </>
        );
    }

    if (gameState.status === 'waiting' && playerIds.length === 2) {
        return (
          <>
            <GlobalStyles />
            <div className="main-container">
              <div className="card" style={{maxWidth: '28rem', position: 'relative'}}>
                  <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#67e8f9'}}>Iniciando Rodada...</h2>
                  <p className="card-subtitle">Buscando personagens para o duelo!</p>
                  <Loader2 className="loader" size={32} style={{margin: '1rem auto', color: '#0891b2'}} />
              </div>
            </div>
          </>
        );
    }

    if (gameState.status === 'error') {
        return (
          <>
            <GlobalStyles />
            <div className="main-container">
              <div className="card" style={{maxWidth: '28rem', position: 'relative'}}>
                  <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#f87171'}}>Ocorreu um Erro</h2>
                  <p className="card-subtitle">{gameState.errorMessage || 'Não foi possível iniciar a rodada.'}</p>
                  {gameState.hostId === userId && (
                    <button onClick={() => fetchMultiplayerCharacters(gameId)} className="button button-cyan" style={{marginTop: '1rem'}}>
                      <RefreshCw size={20} /> Tentar Novamente
                    </button>
                  )}
                   <button onClick={goBackToLobby} className="button button-gray" style={{marginTop: '1rem'}}>
                      Voltar ao Lobby
                    </button>
              </div>
            </div>
          </>
        );
    }
      
    return (
      <>
        <GlobalStyles />
        <div className="main-container">
            <div className="card" style={{maxWidth: '60rem', position: 'relative'}}>
                <button onClick={goBackToLobby} className="back-button"><ArrowLeft/></button>
                {/* Placar */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(17, 24, 39, 0.5)', borderRadius: '0.5rem', border: '1px solid #374151'}}>
                    <div style={{width: '40%'}}><p style={{fontSize: '0.875rem', color: '#67e8f9'}}>Você</p><p style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'white'}}>{myInfo?.score || 0}</p></div>
                    <div style={{width: '20%'}}><p style={{fontSize: '1rem', fontWeight: 'bold', color: '#9ca3af'}}>Round {gameState.round}</p></div>
                    <div style={{width: '40%'}}><p style={{fontSize: '0.875rem', color: '#fca5a5'}}>Oponente</p><p style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'white'}}>{opponentInfo?.score || 0}</p></div>
                </div>

                {gameState.status === 'roundOver' ? (
                    <div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', backgroundColor: 'rgba(17, 24, 39, 0.7)', borderRadius: '0.5rem', border: '1px solid #374151'}}>
                        <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #fcd34d, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Fim da Rodada!</h2>
                        {gameState.roundWinner === userId ? <p style={{color: '#34d399', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}><Crown/> Você venceu!</p> : <p style={{color: '#f87171', fontSize: '1.125rem'}}>Seu oponente venceu.</p>}
                        <div style={{textAlign: 'left', backgroundColor: 'rgba(55, 65, 81, 0.5)', padding: '1rem', borderRadius: '0.375rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                           <p>Seu personagem era: <span style={{fontWeight: 'bold', color: '#67e8f9'}}>{myInfo.character.name}</span></p>
                           <p>Personagem do oponente: <span style={{fontWeight: 'bold', color: '#fca5a5'}}>{opponentInfo.character.name}</span></p>
                        </div>
                        {gameState.hostId === userId && <button onClick={handleNextRound} className="button button-cyan" style={{marginTop: '1rem'}}>Próxima Rodada</button>}
                        {gameState.hostId !== userId && <p style={{marginTop: '1rem', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}><Loader2 className="loader" />Aguardando host...</p>}
                    </div>
                ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                    {/* Painel de Ataque */}
                    <div style={{width: '100%', padding: '1rem', backgroundColor: 'rgba(17, 24, 39, 0.7)', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '2px solid', borderColor: isMyTurn ? '#0891b2' : 'rgba(8, 145, 178, 0.2)', boxShadow: isMyTurn ? '0 0 20px rgba(8, 145, 178, 0.3)' : 'none', transition: 'all 0.3s ease', opacity: isMyTurn ? 1 : 0.6}}>
                        <h3 style={{fontWeight: 'bold', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#67e8f9'}}><Sword size={20}/> SEU ATAQUE {isMyTurn && "(Sua vez)"}</h3>
                        <p style={{color: '#d1d5db', fontSize: '0.875rem'}}>Adivinhe o personagem do oponente de:</p>
                        <p style={{fontSize: '1.25rem', fontWeight: '600', color: 'white'}}>{opponentInfo?.character?.anime || '???'}</p>
                        <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50px'}}>
                            <LetterPlaceholders name={opponentInfo?.character?.name} revealedIndices={opponentInfo?.revealedIndices} />
                        </div>
                        <form onSubmit={handleMultiplayerGuess} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem'}}>
                            <input type="text" value={multiplayerGuess} onChange={(e) => setMultiplayerGuess(e.target.value)} placeholder="Seu palpite..." className="input-field" disabled={!isMyTurn || gameState.status !== 'playing'}/>
                            <button type="submit" className="button button-cyan" disabled={!isMyTurn || gameState.status !== 'playing'}>Adivinhar</button>
                        </form>
                    </div>

                    {/* Painel de Defesa */}
                    <div style={{width: '100%', padding: '1rem', backgroundColor: 'rgba(17, 24, 39, 0.7)', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '2px solid', borderColor: !isMyTurn ? '#dc2626' : 'rgba(220, 38, 38, 0.2)', boxShadow: !isMyTurn ? '0 0 20px rgba(220, 38, 38, 0.3)' : 'none', transition: 'all 0.3s ease', opacity: !isMyTurn ? 1 : 0.6}}>
                        <h3 style={{fontWeight: 'bold', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#fca5a5'}}><Shield size={20}/> SUA DEFESA {!isMyTurn && "(Vez do oponente)"}</h3>
                        <p style={{color: '#d1d5db', fontSize: '0.875rem'}}>Seu oponente precisa adivinhar de:</p>
                        <p style={{fontSize: '1.25rem', fontWeight: '600', color: 'white'}}>{myInfo?.character?.anime || '???'}</p>
                        <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50px'}}>
                             <LetterPlaceholders name={myInfo?.character?.name} revealedIndices={myInfo?.revealedIndices} />
                        </div>
                        <div style={{height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', paddingTop: '0.5rem'}}>
                            {gameState.guesses && gameState.guesses[opponentId] ? <p style={{fontSize: '0.875rem', color: '#9ca3af'}}>Último palpite do oponente: <span style={{fontFamily: 'monospace', color: 'white', backgroundColor: 'rgba(55, 65, 81, 0.5)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}>{gameState.guesses[opponentId]}</span></p> : <p style={{fontSize: '0.875rem', color: '#6b7280'}}>Aguardando palpite do oponente...</p>}
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
      </>
    );
  };

  // --- ROTEAMENTO DE RENDERIZAÇÃO ---
  if (isLoading) return renderLoading();
  
  switch (gameMode) {
    case 'singleplayer':
      return renderSinglePlayer();
    case 'multiplayer':
      if (gameState) return renderMultiplayer();
      return renderLobby(); // Fallback para o lobby se não houver gameState
    case 'lobby':
    default:
      return renderLobby();
  }
}
