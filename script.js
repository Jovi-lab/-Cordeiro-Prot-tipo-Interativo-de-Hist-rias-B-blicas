// Protótipo simples: carregamento de catálogo e player de nós
(async function(){
  const intro = document.getElementById('intro');
  const startBtn = document.getElementById('startBtn');
  const skipIntro = document.getElementById('skipIntro');
  const nameInput = document.getElementById('playerName');
  const main = document.getElementById('main');
  const displayName = document.getElementById('displayName');
  const catalogEl = document.getElementById('catalog');
  const storyView = document.getElementById('storyView');
  const nodeCard = document.getElementById('nodeCard');
  const backBtn = document.getElementById('backToCatalog');

  const STORIES_INDEX = [
    'stories/example-story.json'
  ];

  // load stories metadata quickly
  async function loadStory(path){
    const res = await fetch(path);
    if(!res.ok) throw new Error('Erro ao carregar história: ' + path);
    return res.json();
  }

  // Initial name from localStorage
  const savedName = localStorage.getItem('playerName') || '';
  if(savedName) nameInput.value = savedName;

  function showMain(){
    intro.classList.add('hidden');
    main.classList.remove('hidden');
    displayName.textContent = localStorage.getItem('playerName') || 'visitante';
  }

  startBtn.addEventListener('click', () => {
    const val = nameInput.value.trim();
    if(!val) { alert('Digite um nome para continuar'); return; }
    localStorage.setItem('playerName', val);
    showMain();
  });

  skipIntro.addEventListener('click', () => {
    if(!localStorage.getItem('playerName')){
      nameInput.value = 'visitante';
      localStorage.setItem('playerName','visitante');
    }
    showMain();
  });

  // Build catalog
  async function buildCatalog(){
    catalogEl.innerHTML = '';
    for(const path of STORIES_INDEX){
      try{
        const story = await loadStory(path);
        const card = document.createElement('div'); card.className = 'card';
        const title = document.createElement('h3'); title.textContent = story.title;
        const desc = document.createElement('p'); desc.textContent = story.description || '';
        const btn = document.createElement('button'); btn.textContent = 'Entrar na História';
        btn.addEventListener('click', () => openStory(story));
        card.appendChild(title); card.appendChild(desc); card.appendChild(btn);
        catalogEl.appendChild(card);
      }catch(e){
        console.error(e);
      }
    }
  }

  // Player state
  let currentStory = null;
  let currentNode = null;

  function findNode(story, id){
    return story.nodes.find(n => n.id === id);
  }

  function saveProgress(storyId, nodeId){
    localStorage.setItem('progress_' + storyId, nodeId);
  }

  function loadProgress(storyId){
    return localStorage.getItem('progress_' + storyId);
  }

  function renderNode(node, story){
    nodeCard.innerHTML = '';
    const h = document.createElement('h3'); h.textContent = node.title || '';
    const p = document.createElement('p'); p.textContent = node.text || '';
    nodeCard.appendChild(h); nodeCard.appendChild(p);

    // assets placeholder (if present later)
    if(node.assets && Object.keys(node.assets).length){
      const assetNote = document.createElement('div'); assetNote.textContent = '[Assets disponíveis]';
      assetNote.style.color = '#a8a8a8'; nodeCard.appendChild(assetNote);
    }

    const choicesWrap = document.createElement('div'); choicesWrap.className = 'choices';
    if(node.choices && node.choices.length){
      node.choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = ch.label;
        if(ch.faithful === true) btn.classList.add('choice-faithful');
        if(ch.faithful === false) btn.classList.add('choice-nonfaithful');
        btn.addEventListener('click', () => {
          if(!ch.nextNodeId){
            alert('Opção sem próximo nó');
            return;
          }
          const next = findNode(story, ch.nextNodeId);
          if(!next){ alert('Próximo nó não encontrado'); return; }
          currentNode = next;
          saveProgress(story.storyId, currentNode.id);
          renderNode(currentNode, story);
        });
        choicesWrap.appendChild(btn);
      });
      nodeCard.appendChild(choicesWrap);
    } else {
      // Ending
      const endNote = document.createElement('div'); endNote.className = 'ending-note';
      const et = node.endingType || 'Conlusão';
      if(et === 'canonical'){
        endNote.innerHTML = '<strong>Fim (fiel à narrativa):</strong> Esta conclusão está alinhada à passagem original.';
      } else if(et === 'fictional'){
        endNote.innerHTML = '<strong>Fim (ramo fictício):</strong> Esta conclusão é uma variação com valor reflexivo, mas não corresponde literalmente à passagem bíblica.';
      } else {
        endNote.innerHTML = '<strong>Fim:</strong> ' + (node.text || '');
      }
      const restart = document.createElement('button'); restart.textContent = 'Reiniciar história';
      restart.className = 'choice-btn';
      restart.addEventListener('click', () => {
        const startNode = findNode(story, story.initialNodeId);
        if(startNode){ currentNode = startNode; saveProgress(story.storyId, startNode.id); renderNode(currentNode, story); }
      });
      nodeCard.appendChild(endNote); nodeCard.appendChild(restart);
    }

    // If the choice was non-faithful, show an extra hint link to reflect
    if(node.isEnding && node.endingType === 'fictional'){
      const hint = document.createElement('p');
      hint.style.color = '#d1d5db'; hint.style.marginTop = '10px';
      hint.textContent = 'Dica: esta versão tem um desfecho ficcional — sempre consulte a passagem original para a narrativa bíblica.';
      nodeCard.appendChild(hint);
    }
  }

  function openStory(story){
    currentStory = story;
    // check saved progress
    const saved = loadProgress(story.storyId);
    const startNode = saved ? findNode(story, saved) : findNode(story, story.initialNodeId);
    currentNode = startNode || findNode(story, story.initialNodeId);
    // toggle view
    storyView.classList.remove('hidden');
    document.getElementById('catalog').classList.add('hidden');
    renderNode(currentNode, story);
  }

  backBtn.addEventListener('click', () => {
    storyView.classList.add('hidden');
    document.getElementById('catalog').classList.remove('hidden');
  });

  // bootstrap
  await buildCatalog();

  // If the user already had a name -> show main immediately
  if(localStorage.getItem('playerName')){
    showMain();
  }
})();
