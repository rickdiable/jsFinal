console.clear();

const baseUrl = "https://hexschoollivejs.herokuapp.com";

// DOM
const productList = document.querySelector('.productWrap');
const cartList = document.querySelector('.shoppingCart-tableList');
const selectBtn = document.querySelector('.productSelect');
const discardAllBtn = document.querySelector('.discardAllBtn');
const customerEmail = document.querySelector("#customerEmail");
const customerPhone = document.querySelector("#customerPhone");
const orderInfoBtn = document.querySelector('.orderInfo-btn');

// 監聽
productList.addEventListener("click", postProductId);
selectBtn.addEventListener("change", productSelect);
cartList.addEventListener("click", deleteCartItem);
cartList.addEventListener("click", editCartList);
discardAllBtn.addEventListener("click", deleteAllCart);
orderInfoBtn.addEventListener("click", postOrderInfo);
customerEmail.addEventListener("blur", emailReminder);
customerPhone.addEventListener("blur", phoneReminder);

// 初始化
function init() {
    getProductList();
    getCartList();
}

init();

// 取得產品資訊
let productData = [];

// 抓取產品清單
function getProductList() {
    let url = `${baseUrl}/api/livejs/v1/customer/${api_path}/products`;
    axios.get(url)
        .then(function (res) {
            productData = res.data.products;
            // console.log(productData[0]);
            renderProduct();
        })
        .catch(function (error) {
            console.log(error);
        })
}

// 重複內容整理
function combineString(item) {
    return `<li class="productCard">
        <h4 class="productType">新品</h4>
        <img src=${item.images} alt="">
        <a href="#" id="addCardBtn" class="js-addCart" data-id="${item.id}">加入購物車</a>
        <h3>${item.title}</h3>
        <del class="originPrice">NT$${toThousands(item.origin_price)}</del>
        <p class="nowPrice">NT$${toThousands(item.price)}</p>
</li>`
}

// 更新產品清單
function renderProduct() {
    let str = "";
    productData.forEach(function (item) {
        str += combineString(item);
    })
    productList.innerHTML = str;
}


// 篩選種類功能
function productSelect(e) {
    if (e.target.value == "全部") {
        renderProduct();
        return;
    }
    let str = "";
    productData.forEach(function (item) {
        if (e.target.value == item.category) {
            str += combineString(item);
        }
    })
    productList.innerHTML = str;
}


// 取得購物車資訊
let cartData = [];

function getCartList() {
    let url = `${baseUrl}/api/livejs/v1/customer/${api_path}/carts`;
    axios.get(url)
        .then(function (res) {
            cartData = res.data.carts;
            const cartTotalPrice = res.data.finalTotal;
            // console.log(cartData);
            // 顯示總價格(由後端計算)
            const finalTotal = document.querySelector('.finalTotal');
            finalTotal.textContent = `NT$${toThousands(cartTotalPrice)}`;
            let str = "";
            // 更新購物車清單資訊
            cartData.forEach(function (item) {
                str += `<tr>
                <td>
                    <div class="cardItem-title">
                        <img src=${item.product.images} alt="">
                        <p>${item.product.title}</p>
                    </div>
                </td>
                <td>NT$${toThousands(item.product.price)}</td>
                <td class="cardItem-quantity">
                    <a href="#" class="material-icons" data-click="remove" data-id=${item.id}>
                    remove_circle_outline</a>
                    <span>${item.quantity}</span>
                    <a href="#" class="material-icons" data-click="add" data-id=${item.id}>
                    add_circle_outline</a>
                </td>
                <td>NT$${toThousands(item.product.price * item.quantity)}</td>
                <td class="discardBtn">
                    <a href="#" class="material-icons" data-id="${item.id}" data-click="clear">
                        clear
                    </a>
                </td>
            </tr>`
            })
            cartList.innerHTML = str;
        })
        .catch(function (error) {
            console.log(error);
        })
}

// 點擊新增購物車品項
function postProductId(e) {
    e.preventDefault();
    let addCartClass = e.target.getAttribute('class');
    // console.log(addCartClass);
    if (addCartClass !== "js-addCart") {
        return;
    }
    let productId = e.target.getAttribute("data-id");
    let numCheck = 1;

    cartData.forEach(function (item) {
        if (item.product.id === productId) {
            numCheck = item.quantity += 1;
        }
    })

    axios.post(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`, {
        "data": {
            "productId": productId,
            "quantity": numCheck
        }
    }).then(function (response) {
        alert("商品已成功加入購物車");
        getCartList();
    })
}

// 點擊加減icon更換購物車中產品數量
function editCartList(e) {
    let num = 0;
    let cartId = e.target.getAttribute('data-id');
    cartData.forEach(function (item) {
        if (item.id === cartId) {
            num = item.quantity;
        }
    });
    if (e.target.getAttribute('data-click') == 'add') {
        num += 1;
        editCartNum(cartId, num);
        alert('成功加入一筆');
        return;
    } else if (e.target.getAttribute('data-click') == 'remove') {
        if (num <= 1) {
            alert('不可小於最小數量一筆!');
            return;
        }
        num -= 1;
        editCartNum(cartId, num);
        alert('成功刪除一筆');
        return;
    }
}

function editCartNum(cartId, num) {
    let obj = {
        "data": {
            "id": cartId,
            "quantity": num
        }
    };
    axios.patch(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`, obj)
        .then(function (res) {
            getCartList();
        })
        .catch(function (error) {
            alert('修改數量失敗');
        })
}

// 刪除購物車品項
// 刪除單筆
function deleteCartItem(e) {
    e.preventDefault();
    const cartId = e.target.getAttribute('data-id');
    if (cartId == null) {
        console.log("點到其他地方了!");
        return;
    } else if (e.target.getAttribute('data-click') == "clear") {
        console.log(cartId);
        axios.delete(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts/${cartId}`)
            .then(function (response) {
                alert("刪除單筆購物車成功");
                getCartList();
            })
    }
}

// 刪除全部
function deleteAllCart(e) {
    e.preventDefault();
    axios.delete(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`)
        .then(function (response) {
            alert("刪除所有購物車成功！");
            getCartList();
        })
        .catch(function (response) {
            alert("購物車已清空，請勿重複點擊")
        })
}

// 送出訂單
function postOrderInfo(e) {
    e.preventDefault();
    if (cartData.length == 0) {
        alert("購物車為空，請加入商品");
        return;
    }
    // 表單驗證
    const customerName = document.querySelector("#customerName").value;
    const customerPhone = document.querySelector("#customerPhone").value;
    const customerEmail = document.querySelector("#customerEmail").value;
    const customerAddress = document.querySelector("#customerAddress").value;
    const customerTradeWay = document.querySelector("#tradeWay").value;
    if (customerName == "" || customerPhone == "" || customerEmail == "" || customerAddress == "" || customerTradeWay == "") {
        alert("尚有資料未填寫完成");
        return;
    }

    // post訂單資料
    axios.post(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${api_path}/orders`, {
        "data": {
            "user": {
                "name": customerName,
                "tel": customerPhone,
                "email": customerEmail,
                "address": customerAddress,
                "payment": customerTradeWay
            }
        }
    }).then(function (response) {
        alert("訂單建立成功");
        // 清空表單資料並再次初始化購物車列表
        document.querySelector("#customerName").value = "";
        document.querySelector("#customerPhone").value = "";
        document.querySelector("#customerEmail").value = "";
        document.querySelector("#customerAddress").value = "";
        document.querySelector("#tradeWay").value = "ATM";
        getCartList();
    })
}

// email及電話輸入錯誤提醒
function emailReminder() {
    document.querySelector(`[data-message=Email]`).textContent = "";
    if (validateEmail(customerEmail.value) == false) {
        document.querySelector(`[data-message=Email]`).textContent = "請填寫正確 Email 格式";
        return;
    }
}

function phoneReminder() {
    document.querySelector(`[data-message=tel]`).textContent = "";
    if (validatePhone(customerPhone.value) == false) {
        console.log(document.querySelector(`[data-message=tel]`));
        document.querySelector(`[data-message=tel]`).textContent = "請填寫正確電話格式";
        return;
    }
}

// util js、元件
function toThousands(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function validateEmail(mail) {
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail)) {
        return true
    }
    return false;
}

function validatePhone(phone) {
    if (/^[09]{2}\d{8}$/.test(phone)) {
        return true
    }
    return false;
}