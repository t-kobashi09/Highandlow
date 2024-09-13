let deckId;
let dealerHand = [];
let playerHand = [];
let totalWins = 0;
let dealerCardSelected = false;
let playerCardSelected = false;
let selectedPlayerCard = null;
let isGameOver = false;

const deckApiUrl = "https://deckofcardsapi.com/api/deck";

// ゲーム開始時にデッキを取得
window.onload = () => {
    fetch(`${deckApiUrl}/new/shuffle/?deck_count=1`)
        .then(response => response.json())
        .then(data => {
            deckId = data.deck_id;
            drawCards(); // 初期カードを引く
        })
        .catch(error => console.error('Error initializing deck:', error));

    document.getElementById('high-button').addEventListener('click', () => evaluateResult(true));
    document.getElementById('low-button').addEventListener('click', () => evaluateResult(false));
};

// カードを引いて手札を設定
function drawCards() {
    fetch(`${deckApiUrl}/${deckId}/draw/?count=20`) // 20枚引く
        .then(response => response.json())
        .then(data => {
            if (data.cards.length < 20) {
                throw new Error('Not enough cards returned from API');
            }

            playerHand = data.cards.slice(0, 10);  // プレイヤーは10枚
            dealerHand = data.cards.slice(10, 20); // ディーラーも10枚

            updatePlayerHand(); // プレイヤーの手札を表示
            updateDealerHand(); // ディーラーの手札を表示

            const drawButton = document.getElementById('draw-deck');
            drawButton.disabled = true; // カードが引かれた後、ボタンを無効化
        })
        .catch(error => console.error('Error drawing cards:', error));
}

// プレイヤーの手札を更新
function updatePlayerHand() {
    const drawnCardsDiv = document.getElementById('drawn-cards');
    drawnCardsDiv.innerHTML = ''; // 前回の表示をクリア

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
}

// ディーラーの手札を更新（裏面を表示）
function updateDealerHand() {
    const dealerDrawnCardsDiv = document.getElementById('dealer-drawn-cards');
    dealerDrawnCardsDiv.innerHTML = ''; // 前回の表示をクリア

    dealerHand.forEach(() => {
        const backImg = document.createElement('img');
        backImg.src = "https://deckofcardsapi.com/static/img/back.png"; // 裏面画像
        dealerDrawnCardsDiv.appendChild(backImg);
    });
}

// プレイヤーがカードを選択
function selectCard(cardImg) {
    if (playerCardSelected) {
        alert('既にカードが選択されています。カードを戻してください。');
        return;
    }

    console.log('Card selected:', cardImg.dataset.value, cardImg.dataset.suit);

    const selectedCardsDiv = document.getElementById('selected-cards');
    const clonedCard = cardImg.cloneNode(true);
    clonedCard.onclick = function() { returnCard(clonedCard); };
    selectedCardsDiv.appendChild(clonedCard);

    cardImg.remove(); // プレイヤー手札から削除

    playerCardSelected = true;
    selectedPlayerCard = clonedCard;

    if (!dealerCardSelected) {
        dealerAutoMove();
    }
}

// ディーラーが自動でカードを選択
function dealerAutoMove() {
    if (dealerHand.length === 0) {
        console.error("ディーラーの手札がありません。");
        return;
    }

    const dealerSelectedDiv = document.getElementById('dealer-selected-cards');
    dealerSelectedDiv.innerHTML = ''; // 前回の選択をクリア

    // ディーラーのカードを1枚取得し、裏面画像で表示
    const dealerCard = dealerHand[0]; // 手札は保持する
    const backImg = document.createElement('img');
    backImg.src = "https://deckofcardsapi.com/static/img/back.png"; // 裏面画像
    backImg.alt = `ディーラーのカード`;
    backImg.dataset.value = dealerCard.value;
    backImg.dataset.suit = dealerCard.suit;
    backImg.dataset.code = dealerCard.code;
    dealerSelectedDiv.appendChild(backImg);

    dealerCardSelected = true;

    // ディーラーの手札表示を更新（手札からは削除しない）
    const dealerDrawnCardsDiv = document.getElementById('dealer-drawn-cards');
    if (dealerDrawnCardsDiv.children.length > 0) {
        dealerDrawnCardsDiv.removeChild(dealerDrawnCardsDiv.children[0]);
    }
}

// プレイヤーの選んだカードを戻す
function returnCard(cardElement) {
    const drawnCardsDiv = document.getElementById('drawn-cards');
    const clonedCard = cardElement.cloneNode(true);
    clonedCard.onclick = function() { selectCard(clonedCard); };
    drawnCardsDiv.appendChild(clonedCard);

    cardElement.remove(); // 選択されたカードを削除

    playerCardSelected = false;
    selectedPlayerCard = null;
}

// カードの値を数値化
function getCardValue(value) {
    if (value === 'ACE') return 14;
    if (value === 'KING') return 13;
    if (value === 'QUEEN') return 12;
    if (value === 'JACK') return 11;
    return parseInt(value);
}

// 勝敗を判定
function evaluateResult(isHigh) {
    if (!selectedPlayerCard || !dealerCardSelected) {
        alert("プレイヤーまたはディーラーのカードが選択されていません。");
        return;
    }

    const playerCardValue = getCardValue(selectedPlayerCard.dataset.value);
    
    // ディーラーの選んだカードを表面に切り替える
    const dealerCardElement = document.getElementById('dealer-selected-cards').querySelector('img');
    dealerCardElement.src = `https://deckofcardsapi.com/static/img/${dealerCardElement.dataset.code}.png`; // 表面画像
    const dealerCardValue = getCardValue(dealerCardElement.dataset.value);

    let result = "";
    if (isHigh) {
        result = playerCardValue > dealerCardValue ? "勝ち！" : (playerCardValue < dealerCardValue ? "負け..." : "引き分け");
    } else {
        result = playerCardValue < dealerCardValue ? "勝ち！" : (playerCardValue > dealerCardValue ? "負け..." : "引き分け");
    }

    document.getElementById('result').textContent = result;

    if (result === "勝ち！") {
        totalWins++;
        discardPlayedCards(); // 勝利時に場のカードを捨てる
        setTimeout(startNextRound, 3000); // 次のラウンドを3秒後に開始
    } else if (result === "負け...") {
        discardPlayedCards(); // 負けても場のカードを捨てる
        gameOver();
    } else {
        handleDraw(); // 引き分けの場合
    }

    console.log(`連勝: ${totalWins}`);
}

// 引き分けの処理
function handleDraw() {
    alert("引き分けです。もう一枚カードを引いてください。");
}

// プレイしたカードを捨てる（手札には影響しない）
function discardPlayedCards() {
    // プレイヤーの選択カードをクリア
    const playerSelectedDiv = document.getElementById('selected-cards');
    playerSelectedDiv.innerHTML = ''; // 選択されたプレイヤーのカードを削除

    // ディーラーの選択カードをクリア
    const dealerSelectedDiv = document.getElementById('dealer-selected-cards');
    dealerSelectedDiv.innerHTML = ''; // 選択されたディーラーのカードを削除

    playerCardSelected = false;
    dealerCardSelected = false;
}

// 次のラウンドを開始
function startNextRound() {
    if (playerHand.length === 0 || dealerHand.length === 0) {
        gameOver();
        return;
    }

    updatePlayerHand(); // プレイヤーの手札を再表示
    updateDealerHand(); // ディーラーの手札を再表示
}

// ゲームオーバー時の処理
function gameOver() {
    alert("ゲームオーバーです。スタート画面に戻ります。");
    setTimeout(() => {
        window.location.href = 'index.html'; // スタート画面に戻る
    }, 2000);
}
