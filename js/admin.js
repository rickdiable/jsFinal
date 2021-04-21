// DOM
const orderList = document.querySelector('.js-orderList');

// 取得訂單資料
let orderData = [];

function getOrderList() {
    axios.get(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`, {
            headers: {
                'Authorization': token,
            }
        })
        .then(function (response) {
            orderData = response.data.orders;
            console.log(orderData[0]);
            let str = "";
            orderData.forEach(function (item) {
                // 組時間字串
                const timeStamp = new Date(item.createdAt * 1000);
                const orderTime = `${timeStamp.getFullYear()}/${timeStamp.getMonth()+1}/${timeStamp.getDate()}`;
                // 回傳月份 0 代表 1 月，為顯示正確月份故需+1

                // 組產品字串 (產品名稱 x 數量)
                let productStr = "";
                item.products.forEach(function (productItem) {
                    productStr += `<p>${productItem.title}x${productItem.quantity}</p>`
                })
                // 若訂單有多項產品則用forEach跑出全部

                // 判斷訂單處理狀態
                let orderStatus = "";
                if (item.paid == true) {
                    orderStatus = "已處理"
                } else {
                    orderStatus = "未處理"
                }
                str += `<tr>
                            <td>${item.id}</td>
                            <td>
                                <p>${item.user.name}</p>
                                <p>${item.user.tel}</p>
                            </td>
                            <td>${item.user.address}</td>
                            <td>${item.user.email}</td>
                            <td>
                                <p>${productStr}</p>
                            </td>
                            <td>${orderTime}</td>
                            <td class="js-orderStatus">
                                <a href="#" data-status=${item.paid} data-id=${item.id} class="orderStatus">${orderStatus}</a>
                            </td>
                            <td>
                                <input type="button" class="delSingleOrder-Btn" data-id="${item.id}" value="刪除">
                            </td>
                        </tr>`
            })
            orderList.innerHTML = str;
            renderC3LV2();
        })
}

// 更改處理狀態
function changeStatus(e) {
    let newStatus = "";
    if (e.target.getAttribute("data-status") == "true") {
        newStatus = false;
    } else {
        newStatus = true;
    }
    axios.put(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`, {
            "data": {
                "id": e.target.getAttribute("data-id"),
                "paid": newStatus
            }
        }, {
            headers: {
                'Authorization': token,
            }
        })
        .then(function (response) {
            alert("修改訂單狀態成功");
            getOrderList();
        })
    console.log(newStatus, e.target.getAttribute("data-id"));
}


// 刪除單筆訂單資料
function deleteOrderItem(e) {
    axios.delete(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders/${e.target.getAttribute("data-id")}`, {
            headers: {
                'Authorization': token,
            }
        })
        .then(function (response) {
            alert("刪除該筆訂單成功");
            getOrderList();
        })
}

// 合併orderList上的監聽
orderList.addEventListener("click", function (e) {
    if (e.target.getAttribute("class") == "orderStatus") {
        changeStatus(e);
    } else if (e.target.getAttribute("class") == "delSingleOrder-Btn") {
        deleteOrderItem(e);
    }
});

// 刪除所有訂單資料
const discardAllBtn = document.querySelector('.discardAllBtn');
discardAllBtn.addEventListener("click", deleteAllOrder);

function deleteAllOrder(e) {
    axios.delete(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`, {
            headers: {
                'Authorization': token,
            }
        })
        .then(function (response) {
            alert("刪除該筆訂單成功");
            getOrderList();
        })
}



// 初始化
function init() {
    getOrderList();
}

init();


// c3 LV1：圓餅圖，做全產品類別營收比重，類別含三項，共有：床架、收納、窗簾
function renderC3LV1() {
    let total = {};
    orderData.forEach(function (item) {
        item.products.forEach(function (productItem) {
            if (total[productItem.category] == undefined) {
                total[productItem.category] = productItem.price * productItem.quantity;
            } else {
                total[productItem.category] += productItem.price * productItem.quantity;
            }
            // console.log(total);
        })
    })
    let ary = Object.keys(total);
    console.log(ary);
    // 整理成c3格式
    let chartDataLV1 = [];
    ary.forEach(function (item) {
        let newAry = [];
        newAry.push(item);
        newAry.push(total[item]);
        chartDataLV1.push(newAry);
        console.log(chartDataLV1);
    })
    // 將資料放入c3
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: chartDataLV1,
        },
    });
}

// LV2：做圓餅圖，做全品項營收比重，類別含四項，篩選出前三名營收品項，其他 4~8 名都統整為「其它」
function renderC3LV2() {
    let total = {};
    orderData.forEach(function (item) {
        item.products.forEach(function (productItem) {
            if (total[productItem.title] == undefined) {
                total[productItem.title] = productItem.price * productItem.quantity;;
            } else {
                total[productItem.title] += productItem.price * productItem.quantity;;
            }
        })
        // console.log(total);
    })
    let ary = Object.keys(total);
    // console.log(ary);
    // 整理成c3格式
    let chartDataLV2 = [];
    ary.forEach(function (item) {
        let newAry = [];
        newAry.push(item);
        newAry.push(total[item]);
        chartDataLV2.push(newAry);
    })
    // console.log(chartDataLV2);
    // 用sort排出大小
    chartDataLV2.sort(function (a, b) {
        return b[1] - a[1];
    })
    // console.log(chartDataLV2);
    // 若長度大於 3 則統整為 "其他"
    if (chartDataLV2.length > 3) {
        let otherPrice = 0
        chartDataLV2.forEach(function (item, index) {
            if (index > 2) {
                otherPrice += chartDataLV2[index][1];
            }
        })
        // 將大於 3 筆的資料刪除
        chartDataLV2.splice(3, chartDataLV2.length - 1);
        // 將 "其他" 推入陣列
        chartDataLV2.push(["其他", otherPrice])
        console.log(chartDataLV2);
    }
    // 將整理好的資料放入c3
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: chartDataLV2,
        },
    });
}