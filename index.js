// Game settings
const settings = {
  easy: { pairs: 3, time: 30 },
  medium: { pairs: 6, time: 60 },
  hard: { pairs: 10, time: 90 }
};

let gameState = {
  cards: [],
  flippedCards: [],
  matched: 0,
  clicks: 0,
  totalPairs: 0,
  timeLeft: 0,
  timer: null,
  canFlip: true
};

async function getPokemonImages(pairCount) {
  const ids = [];
  while (ids.length < pairCount) {
    let id = Math.floor(Math.random() * 898) + 1;
    if (!ids.includes(id)) ids.push(id);
  }

  const promises = ids.map(id =>
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(res => res.json())
      .then(data => data.sprites.other["official-artwork"].front_default)
  );

  const images = await Promise.all(promises);
  return images.flatMap(img => [img, img]); // duplicate for pairs
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function updateStatus() {
  $("#clicks").text(gameState.clicks);
  $("#matched").text(gameState.matched);
  $("#pairsLeft").text(gameState.totalPairs - gameState.matched);
  $("#time").text(gameState.timeLeft);
}

function startTimer() {
  clearInterval(gameState.timer);
  gameState.timer = setInterval(() => {
    gameState.timeLeft--;
    updateStatus();
    if (gameState.timeLeft <= 0) {
      clearInterval(gameState.timer);
      gameState.canFlip = false;
      alert("Game Over! Time's up.");
    }
  }, 1000);
}

function createCard(image, index) {
  return `
    <div class="card" data-index="${index}">
      <div class="inner-card">
        <div class="back_face"></div>
        <div class="front_face" style="background-image: url('${image}')"></div>
      </div>
    </div>
  `;
}



function renderCards(images) {
  const grid = $("#game_grid");
  grid.html(images.map((img, i) => createCard(img, i)).join(""));

  $(".card").on("click", function () {
    const index = $(this).data("index");
    if (!gameState.canFlip || $(this).hasClass("flip") || gameState.flippedCards.length === 2) return;

    $(this).addClass("flip");
    gameState.flippedCards.push({ index, image: gameState.cards[index] });
    gameState.clicks++;
    updateStatus();

    if (gameState.flippedCards.length === 2) {
      const [a, b] = gameState.flippedCards;
      if (a.image === b.image) {
        gameState.matched++;
        gameState.flippedCards = [];
        updateStatus();
        if (gameState.matched === gameState.totalPairs) {
          clearInterval(gameState.timer);
          alert("You win!");
        }
      } else {
        gameState.canFlip = false;
        setTimeout(() => {
          $(`.card[data-index='${a.index}']`).removeClass("flip");
          $(`.card[data-index='${b.index}']`).removeClass("flip");
          gameState.flippedCards = [];
          gameState.canFlip = true;
        }, 1000);
      }
    }
  });
}

async function startGame() {
  const level = $("#difficulty").val();
  const { pairs, time } = settings[level];

  gameState = {
    cards: [],
    flippedCards: [],
    matched: 0,
    clicks: 0,
    totalPairs: pairs,
    timeLeft: time,
    timer: null,
    canFlip: true
  };

  updateStatus();
  const images = await getPokemonImages(pairs);
  const shuffled = shuffle(images);
  gameState.cards = shuffled;
  renderCards(shuffled);
  startTimer();
}

$(document).ready(() => {
  $("#start").click(startGame);

  $("#reset").click(() => {
    clearInterval(gameState.timer);
    startGame();
  });

  $("#themeToggle").click(() => {
    $("body").toggleClass("dark");
  });

  $("#powerup").click(() => {
    if (!gameState.canFlip) return;
    $(".card").addClass("flip");
    setTimeout(() => {
      $(".card").removeClass("flip");
      gameState.flippedCards = [];
    }, 2000);
  });
});