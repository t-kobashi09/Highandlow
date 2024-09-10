let deckId;
let dealerHand = [];
let playerHand = [];
let score = 0;
let totalHearts = 0;
let totalDiamonds = 0;
let totalClubs = 0;
let totalSpades = 0;

//スタート画面

//シャッフル機能
const deckApiUrl = "https://deckofcardsapi.com/api/deck";

// ゲーム開始時にデッキを取得
window.onload = () => {
    fetch(`${deckApiUrl}/new/shuffle/?deck_count=1`)
        .then(response => response.json())
        .then(data => {
            deckId = data.deck_id;
        });
};
//10渡す機能
// 山札からカードを引く
// カードを引く関数
function drawCards() {
    fetch(`${deckApiUrl}/${deckId}/draw/?count=20`)  // 20枚引く
        .then(response => response.json())
        .then(data => {
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

// カードを選択する関数（必要に応じて実装）
function selectCard(cardImg) {
    // カードが選択されたときの処理
    console.log('Card selected:', cardImg.dataset.value, cardImg.dataset.suit);
}


// ディーラーの手札から1枚を場に出す

//カード表示
//カード選択
// カードを選択してリストに追加、場から削除
function selectCard(cardElement) {
    const selectedCardsDiv = document.getElementById('selected-cards');
    const clonedCard = cardElement.cloneNode(true); 
    clonedCard.onclick = function() { returnCard(clonedCard); }; // クリックしたらカードを戻すように設定
    selectedCardsDiv.appendChild(clonedCard);

    // 場から選択されたカードを削除
    cardElement.remove();
}
function returnCard(cardElement) {
    const drawnCardsDiv = document.getElementById('drawn-cards'); 
    const clonedCard = cardElement.cloneNode(true); 
    clonedCard.onclick = function() { selectCard(clonedCard); }; // クリックしたらカードを選択できるように設定
    drawnCardsDiv.appendChild(clonedCard);

    // 選択済みカードリストからカードを削除
    cardElement.remove();
}

//宣言

//カードを表に

//結果
if (card < trump[trump_n]) {//賭けカードが、伏せカードより大きい場合
    if (Hi_L === 0){ Result = "　LOWを選んで、あなたの<span style='background:blue;'>『 負け 』</span>";}
    if (Hi_L === 1){ Result = "　HIGHを選んで、あなたの<span style='background:red;'>【 勝ち 】</span>";}
}

else if (card > trump[trump_n]) {//賭けカードが、伏せカードより小さい場合
    if (Hi_L === 0){ Result = "　LOWを選んで、あなたの<span style='background:red;'>【 勝ち 】</span>";}
    if (Hi_L === 1){ Result = "　HIGHを選んで、あなたの<span style='background:blue;'>『 負け 』</span>";}
}

else {Result = "引き分け！！";}

    document.getElementById("Card_img_After").src="s_" + trump_n + ".jpg";

document.getElementById("After").innerHTML ="伏せカードは" + trump[trump_n] + Result + "<br />次のカードが今の数字より高いか低いか考えてみよう！";
document.getElementById("Before").innerHTML ="場にあるカードは" + card ;

card = trump[trump_n];//場にあるカードを新しく引いたカードに変える




//連勝を追加
//ドローなら山札を追加



// カードの値を数値に変換する
function getCardValue(value) {
    if (value === 'ACE') return 1;
    if (value === 'JACK' || value === 'QUEEN' || value === 'KING') return 10;
    return parseInt(value);
}
