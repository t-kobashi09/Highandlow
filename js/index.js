let deckId;
let dealerHand = [];
let playerHand = [];
let totalWins = 0;
let dealerCardSelected = false; // ディーラーがカードを選択したかどうかのフラグ
let playerCardSelected = false; // プレイヤーがカードを選択したかどうかのフラグ
let selectedPlayerCard = null; // 選択されたプレイヤーのカード

// スタート画面

// シャッフル機能
const deckApiUrl = "https://deckofcardsapi.com/api/deck";

// ゲーム開始時にデッキを取得
window.onload = () => {
    fetch(`${deckApiUrl}/new/shuffle/?deck_count=1`)
        .then(response => response.json())
        .then(data => {
            deckId = data.deck_id;
        })
        .catch(error => console.error('Error initializing deck:', error));

    // ボタンのイベントリスナーを追加
    document.getElementById('high-button').addEventListener('click', () => evaluateResult(true));
    document.getElementById('low-button').addEventListener('click', () => evaluateResult(false));
};

// 10渡す機能
// 山札からカードを引く
// カードを引く関数
function drawCards() {
    fetch(`${deckApiUrl}/${deckId}/draw/?count=20`)  // 20枚引く
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

            // プレイヤーに10枚配布
            playerHand = data.cards.slice(0, 10);
            // ディーラーに10枚配布
            dealerHand = data.cards.slice(10, 20);

            // プレイヤーのカードを表示
            playerHand.forEach(card => {
                const cardImg = document.createElement('img');
                cardImg.src = card.image;
                cardImg.alt = `${card.value} of ${card.suit}`;
                cardImg.dataset.value = card.value;
                cardImg.dataset.suit = card.suit;

                cardImg.onclick = () => selectCard(cardImg);

                drawnCardsDiv.appendChild(cardImg);
            });

            // ディーラーのカードを裏向きで表示
            const dealerDrawnCardsDiv = document.getElementById('dealer-drawn-cards');

            dealerHand.forEach(card => {
                const backImg = document.createElement('img');
                backImg.src = "https://deckofcardsapi.com/static/img/back.png";
                dealerDrawnCardsDiv.appendChild(backImg);
            });
        })
        .catch(error => console.error('Error drawing cards:', error));
}

// ディーラーのカードを表示する関数
function revealDealerCard() {
    // dealerHandが正しく初期化されているか確認
    if (!dealerHand || dealerHand.length === 0) {
        console.error('No cards available in dealerHand');
        return;
    }

    // ディーラーのカードを取得
    const dealerCard = dealerHand.shift();
    // dealerCardがundefinedでないか確認
    if (!dealerCard) {
        console.error('dealerCard is undefined');
        return;
    }

    // ディーラーのカードを表示する要素
    const dealerCardDiv = document.getElementById('dealer-card');
    dealerCardDiv.innerHTML = ''; // 以前のカードをクリア

    // カード画像を作成
    const cardImg = document.createElement('img');
    cardImg.src = dealerCard.image;
    cardImg.alt = `${dealerCard.value} of ${dealerCard.suit}`;
    dealerCardDiv.appendChild(cardImg);
}

// カードを選択する関数
function selectCard(cardImg) {
    if (playerCardSelected) {
        alert("すでにカードが選択されています。カードを変更するには、選択済みのカードを戻してください。");
        return;
    }

    // カードが選択されたときの処理
    console.log('Card selected:', cardImg.dataset.value, cardImg.dataset.suit);

    const selectedCardsDiv = document.getElementById('selected-cards');
    const clonedCard = cardImg.cloneNode(true);
    clonedCard.onclick = function() { returnCard(clonedCard); }; // クリックしたらカードを戻すように設定
    selectedCardsDiv.appendChild(clonedCard);

    // 場から選択されたカードを削除
    cardImg.remove();

    // プレイヤーのカード選択を記録
    playerCardSelected = true;
    selectedPlayerCard = clonedCard;

    // ディーラーが自動的に裏向きのカードを場に出す処理
    if (!dealerCardSelected) {
        dealerAutoMove();
    }
}

function dealerAutoMove() {
    // ディーラーの手札が空でないか確認
    if (dealerHand.length === 0) {
        console.error("ディーラーの手札は空です");
        return;
    }

    // ディーラーのカードを1枚裏向きで出す
    const dealerSelectedDiv = document.getElementById('dealer-selected-cards');
    const dealerCard = dealerHand.shift(); // 手札から1枚引く
    const backImg = document.createElement('img');
    backImg.src = "https://deckofcardsapi.com/static/img/back.png"; // 裏向きの画像
    backImg.alt = "Dealer's card";
    backImg.dataset.value = dealerCard.value;
    backImg.dataset.suit = dealerCard.suit;
    backImg.dataset.code = dealerCard.code;
    dealerSelectedDiv.appendChild(backImg);

    // ディーラーの手札から表示済みカードを削除
    const dealerDrawnCardsDiv = document.getElementById('dealer-drawn-cards');
    if (dealerDrawnCardsDiv.children.length > 0) {
        dealerDrawnCardsDiv.removeChild(dealerDrawnCardsDiv.children[0]);
    }

    // ディーラーがカードを選択したことを記録
    dealerCardSelected = true;
}

function returnCard(cardElement) {
    const drawnCardsDiv = document.getElementById('drawn-cards');
    const clonedCard = cardElement.cloneNode(true);
    clonedCard.onclick = function() { selectCard(clonedCard); }; // クリックしたらカードを選択できるように設定
    drawnCardsDiv.appendChild(clonedCard);

    // 選択済みカードリストからカードを削除
    cardElement.remove();

    // プレイヤーのカード選択をリセット
    playerCardSelected = false;
    selectedPlayerCard = null;
}

// カードの値を数値に変換する
function getCardValue(value) {
    if (value === 'ACE') return 1;
    if (value === 'JACK' || value === 'QUEEN' || value === 'KING') return 10;
    return parseInt(value);
}

// 結果判定の関数
function evaluateResult(isHigh) {
    const dealerSelectedDiv = document.getElementById('dealer-selected-cards');
    const dealerCardElement = dealerSelectedDiv.querySelector('img');

    if (!selectedPlayerCard || !dealerCardElement) {
        alert("プレイヤーのカードまたはディーラーのカードが選択されていません。");
        return;
    }

    const playerCardValue = getCardValue(selectedPlayerCard.dataset.value);
    const dealerCardValue = getCardValue(dealerCardElement.dataset.value);

    // ディーラーのカードを表向きにする
    console.log(`ディーラーカードバリュー${dealerCardElement.dataset.value}`);
    console.log(`ディーラーカードスイート${dealerCardElement.dataset.suit}`);
    console.log();
    dealerCardElement.src = `https://deckofcardsapi.com/static/img/${dealerCardElement.dataset.code}.png`;

    // 勝敗判定
    let result;
    if (isHigh) {
        result = playerCardValue > dealerCardValue ? "勝ち！" : (playerCardValue < dealerCardValue ? "負け..." : "引き分け");
    } else {
        result = playerCardValue < dealerCardValue ? "勝ち！" : (playerCardValue > dealerCardValue ? "負け..." : "引き分け");
    }

    if (result === "勝ち！") {
        totalWins++;
    } else if (result === "負け...") {
        totalWins = 0; // 連勝をリセット
    }

    document.getElementById('result').textContent = result;
    console.log(`連勝: ${totalWins}`);
}
