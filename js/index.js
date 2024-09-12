let deckId;
let dealerHand = [];
let playerHand = [];
let totalWins = 0;
let dealerCardSelected = false; // ディーラーがカードを選択したかどうかのフラグ
let playerCardSelected = false; // プレイヤーがカードを選択したかどうかのフラグ
let selectedPlayerCard = null; // 選択されたプレイヤーのカード
let isGameOver = false; // ゲームオーバーかどうかのフラグ

const deckApiUrl = "https://deckofcardsapi.com/api/deck";

// ゲーム開始時にデッキを取得
window.onload = () => {
    fetch(`${deckApiUrl}/new/shuffle/?deck_count=1`)
        .then(response => response.json())
        .then(data => {
            deckId = data.deck_id;
        })
        .catch(error => console.error('Error initializing deck:', error));

    document.getElementById('high-button').addEventListener('click', () => evaluateResult(true));
    document.getElementById('low-button').addEventListener('click', () => evaluateResult(false));
};

// 山札からカードを引く関数
function drawCards() {
    fetch(`${deckApiUrl}/${deckId}/draw/?count=20`) // 20枚引く
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!data.cards || data.cards.length < 20) {
                throw new Error('Not enough cards returned from API');
            }

            const drawnCardsDiv = document.getElementById('drawn-cards');
            drawnCardsDiv.innerHTML = ''; // 前回の表示をクリア

            playerHand = data.cards.slice(0, 10);
            dealerHand = data.cards.slice(10, 20);

            playerHand.forEach(card => {
                const cardImg = document.createElement('img');
                cardImg.src = card.image;
                cardImg.alt = `${card.value} of ${card.suit}`;
                cardImg.dataset.value = card.value;
                cardImg.dataset.suit = card.suit;
                cardImg.dataset.code = card.code;
                cardImg.onclick = () => selectCard(cardImg);
                drawnCardsDiv.appendChild(cardImg);
            });

            const dealerDrawnCardsDiv = document.getElementById('dealer-drawn-cards');
            dealerHand.forEach(() => {
                const backImg = document.createElement('img');
                backImg.src = "https://deckofcardsapi.com/static/img/back.png";
                dealerDrawnCardsDiv.appendChild(backImg);
            });
        })
        .catch(error => console.error('Error drawing cards:', error));
}

// ディーラーのカードを表示する関数
function revealDealerCard() {
    if (!dealerHand || dealerHand.length === 0) {
        console.error('No cards available in dealerHand');
        return;
    }

    const dealerCard = dealerHand.shift();
    if (!dealerCard) {
        console.error('dealerCard is undefined');
        return;
    }

    const dealerCardDiv = document.getElementById('dealer-card');
    dealerCardDiv.innerHTML = ''; // 以前のカードをクリア

    const cardImg = document.createElement('img');
    cardImg.src = dealerCard.image;
    cardImg.alt = `${dealerCard.value} of ${dealerCard.suit}`;
    dealerCardDiv.appendChild(cardImg);
}

function selectCard(cardImg) {
    if (playerCardSelected) {
        alert("すでにカードが選択されています。カードを変更するには、選択済みのカードを戻してください。");
        return;
    }

    console.log('Card selected:', cardImg.dataset.value, cardImg.dataset.suit);

    const selectedCardsDiv = document.getElementById('selected-cards');
    const clonedCard = cardImg.cloneNode(true);
    clonedCard.onclick = function() { returnCard(clonedCard); }; // クリックしたらカードを戻すように設定
    selectedCardsDiv.appendChild(clonedCard);

    cardImg.remove();

    playerCardSelected = true;
    selectedPlayerCard = clonedCard;

    if (!dealerCardSelected) {
        dealerAutoMove();
    }
}

function dealerAutoMove() {
    if (dealerHand.length === 0) {
        console.error("ディーラーの手札は空です");
        return;
    }

    const dealerSelectedDiv = document.getElementById('dealer-selected-cards');
    const dealerCard = dealerHand.shift();
    const backImg = document.createElement('img');
    backImg.src = "https://deckofcardsapi.com/static/img/back.png";
    backImg.alt = "Dealer's card";
    backImg.dataset.value = dealerCard.value;
    backImg.dataset.suit = dealerCard.suit;
    backImg.dataset.code = dealerCard.code;
    dealerSelectedDiv.appendChild(backImg);

    const dealerDrawnCardsDiv = document.getElementById('dealer-drawn-cards');
    if (dealerDrawnCardsDiv.children.length > 0) {
        dealerDrawnCardsDiv.removeChild(dealerDrawnCardsDiv.children[0]);
    }

    dealerCardSelected = true;
}

function returnCard(cardElement) {
    const drawnCardsDiv = document.getElementById('drawn-cards');
    const clonedCard = cardElement.cloneNode(true);
    clonedCard.onclick = function() { selectCard(clonedCard); }; // クリックしたらカードを選択できるように設定
    drawnCardsDiv.appendChild(clonedCard);

    cardElement.remove();

    playerCardSelected = false;
    selectedPlayerCard = null;
}

function getCardValue(value) {
    if (value === 'ACE') return 14;
    if (value === 'KING') return 13;
    if (value === 'QUEEN') return 12;
    if (value === 'JACK') return 11;
    return parseInt(value);
}

function evaluateResult(isHigh) {
    const dealerSelectedDiv = document.getElementById('dealer-selected-cards');
    const dealerCardElement = dealerSelectedDiv.querySelector('img');

    if (!selectedPlayerCard || !dealerCardElement) {
        alert("プレイヤーのカードまたはディーラーのカードが選択されていません。");
        return;
    }

    const playerCardValue = getCardValue(selectedPlayerCard.dataset.value);
    const dealerCardValue = getCardValue(dealerCardElement.dataset.value);

    dealerCardElement.src = `https://deckofcardsapi.com/static/img/${dealerCardElement.dataset.code}.png`;

    let result;
    if (isHigh) {
        result = playerCardValue > dealerCardValue ? "勝ち！" : (playerCardValue < dealerCardValue ? "負け..." : "引き分け");
    } else {
        result = playerCardValue < dealerCardValue ? "勝ち！" : (playerCardValue > dealerCardValue ? "負け..." : "引き分け");
    }

    if (result === "勝ち！") {
        totalWins++;
        discardPlayedCards();
        // 勝ち時に次のラウンドを開始する
        setTimeout(startNextRound, 1000); // 1秒待ってから次のラウンドを開始
    } else if (result === "負け...") {
        totalWins = 0;
        // ゲームオーバーの場合、クリックでトップページに戻る処理
        isGameOver = true;
        setupNewGameOnClick();
    } else {
        handleDraw();
    }

    document.getElementById('result').textContent = result;
    console.log(`連勝: ${totalWins}`);
}

function handleDraw() {
    discardPlayedCards();
    drawAdditionalCards();
}

function discardPlayedCards() {
    const playerSelectedCard = document.querySelector('#selected-cards img');
    if (playerSelectedCard) {
        const playerIndex = playerHand.findIndex(card => card.code === playerSelectedCard.dataset.code);
        if (playerIndex > -1) {
            playerHand.splice(playerIndex, 1);
        }
    }

    const dealerSelectedDiv = document.getElementById('dealer-selected-cards');
    const dealerCardElement = dealerSelectedDiv.querySelector('img');
    if (dealerCardElement) {
        const dealerIndex = dealerHand.findIndex(card => card.code === dealerCardElement.dataset.code);
        if (dealerIndex > -1) {
            dealerHand.splice(dealerIndex, 1);
        }
    }

    document.getElementById('selected-cards').innerHTML = '';
    document.getElementById('dealer-selected-cards').innerHTML = '';
}

function drawAdditionalCards() {
    fetch(`${deckApiUrl}/${deckId}/draw/?count=2`) // プレイヤーとディーラーにそれぞれ1枚ずつ引く
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!data.cards || data.cards.length < 2) {
                throw new Error('Not enough cards returned from API');
            }

            const drawnCardsDiv = document.getElementById('drawn-cards');
            const newPlayerCard = data.cards[0];
            const playerCardImg = document.createElement('img');
            playerCardImg.src = newPlayerCard.image;
            playerCardImg.alt = `${newPlayerCard.value} of ${newPlayerCard.suit}`;
            playerCardImg.dataset.value = newPlayerCard.value;
            playerCardImg.dataset.suit = newPlayerCard.suit;
            playerCardImg.dataset.code = newPlayerCard.code;
            playerCardImg.onclick = () => selectCard(playerCardImg);
            drawnCardsDiv.appendChild(playerCardImg);
            playerHand.push(newPlayerCard); // プレイヤーの手札に追加

            const dealerDrawnCardsDiv = document.getElementById('dealer-drawn-cards');
            const dealerCardBackImg = document.createElement('img');
            dealerCardBackImg.src = "https://deckofcardsapi.com/static/img/back.png";
            dealerDrawnCardsDiv.appendChild(dealerCardBackImg);
            dealerHand.push(data.cards[1]); // ディーラーの手札に追加

            playerCardSelected = false;
            dealerCardSelected = false;
            selectedPlayerCard = null;

            if (!isGameOver) {
                startNextRound();
            }
        })
        .catch(error => console.error('Error drawing additional cards:', error));
}

function startNextRound() {
    if (playerHand.length === 0 || dealerHand.length === 0) {
        alert("手札がありません。ゲームを終了します。");
        return;
    }

    const drawnCardsDiv = document.getElementById('drawn-cards');
    drawnCardsDiv.innerHTML = '';

    playerHand.forEach(card => {
        const cardImg = document.createElement('img');
        cardImg.src = card.image;
        cardImg.alt = `${card.value} of ${card.suit}`;
        cardImg.dataset.value = card.value;
        cardImg.dataset.suit = card.suit;
        cardImg.dataset.code = card.code;
        cardImg.onclick = () => selectCard(cardImg);
        drawnCardsDiv.appendChild(cardImg);
    });

    const dealerDrawnCardsDiv = document.getElementById('dealer-drawn-cards');
    dealerDrawnCardsDiv.innerHTML = '';
    dealerHand.forEach(() => {
        const backImg = document.createElement('img');
        backImg.src = "https://deckofcardsapi.com/static/img/back.png";
        dealerDrawnCardsDiv.appendChild(backImg);
    });

    playerCardSelected = false;
    dealerCardSelected = false;
    selectedPlayerCard = null;
}

function setupNewGameOnClick() {
    document.getElementById('result').addEventListener('click', () => {
        window.location.href = 'index.html'; // トップページのURLに変更してください
    });
}

