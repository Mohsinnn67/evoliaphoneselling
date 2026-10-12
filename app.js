$(function () {
    let currentPage = 1;
    const cardsPerPage = 8;
    const $allProducts = $(".product-item");
    let cart = [];

    function filteredProducts() {
        const term = $.trim($("#productSearch").val()).toLowerCase();
        const priceFilter = $("#priceFilter").val();
        return $allProducts.filter(function () {
            const $card = $(this);
            const name = $card.find(".product-title").text().toLowerCase();
            const price = parseFloat($card.find(".price").text().replace(/[^0-9.]/g, "")) || 0;
            const matchesName = name.indexOf(term) !== -1;
            let matchesPrice = true;
            if (priceFilter === "under50") matchesPrice = price < 50;
            if (priceFilter === "50to100") matchesPrice = price >= 50 && price <= 100;
            if (priceFilter === "over100") matchesPrice = price > 100;
            return matchesName && matchesPrice;
        });
    }

    function renderProducts(page, scroll) {
        const $visible = filteredProducts();
        const pages = Math.max(1, Math.ceil($visible.length / cardsPerPage));
        currentPage = Math.max(1, Math.min(page, pages));
        $allProducts.hide();
        $visible.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage).show();

        $("#pagination .page-item:not(#previousButton):not(#nextButton)").remove();
        for (let i = 1; i <= pages; i++) {
            const $item = $('<li class="page-item"><a class="page-link" href="#products"></a></li>');
            $item.find("a").text(i).on("click", function (event) {
                event.preventDefault();
                renderProducts(i, true);
            });
            if (i === currentPage) $item.addClass("active");
            $item.insertBefore("#nextButton");
        }
        $("#previousButton").toggleClass("disabled", currentPage === 1);
        $("#nextButton").toggleClass("disabled", currentPage === pages);
        $("#productResults").text("Showing " + $visible.length + " matching product(s) · Page " + currentPage + " of " + pages);
        if (scroll) $("html, body").animate({ scrollTop: $("#products").offset().top - 70 }, 350);
    }

    $("#previousButton a").on("click", function (e) { e.preventDefault(); renderProducts(currentPage - 1, true); });
    $("#nextButton a").on("click", function (e) { e.preventDefault(); renderProducts(currentPage + 1, true); });
    $("#productSearch, #priceFilter").on("input change", function () { renderProducts(1, false); });
    $("#clearFilters").on("click", function () {
        $("#productSearch").val("");
        $("#priceFilter").val("all");
        renderProducts(1, false);
    });

    function renderCart() {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        $("#cartCount").text(count);
        $("#cartTotal").text("$" + total.toFixed(2));
        if (!cart.length) {
            $("#cartItems").html('<p class="text-muted text-center py-4">Your cart is empty. Add a product to get started.</p>');
            return;
        }
        const $list = $("<div>");
        $.each(cart, function (index, item) {
            const $row = $('<div class="d-flex align-items-center gap-3 py-3 border-bottom"></div>');
            $("<img>").addClass("cart-item-img").attr({ src: item.image, alt: item.name }).appendTo($row);
            const $details = $('<div class="flex-grow-1"></div>');
            $("<strong>").text(item.name).appendTo($details);
            $('<div class="text-muted"></div>').text("$" + item.price.toFixed(2) + " each").appendTo($details);
            $('<button type="button" class="btn btn-sm btn-link text-danger p-0 mt-1">Remove</button>').on("click", function () {
                cart.splice(index, 1); renderCart();
            }).appendTo($details);
            $details.appendTo($row);
            $('<input type="number" min="1" max="99" class="form-control cart-qty" aria-label="Quantity">')
                .val(item.quantity).on("change", function () {
                    item.quantity = Math.max(1, Math.min(99, parseInt($(this).val(), 10) || 1));
                    renderCart();
                }).appendTo($row);
            $("<strong>").text("$" + (item.price * item.quantity).toFixed(2)).appendTo($row);
            $row.appendTo($list);
        });
        $("#cartItems").empty().append($list.children());
    }

    $(document).on("click", ".add-to-cart-btn", function () {
        const $button = $(this);
        const $card = $button.closest(".product-card");
        const name = $card.find(".product-title").text().trim();
        const price = parseFloat($card.find(".price").text().replace(/[^0-9.]/g, "")) || 0;
        const image = $card.find("img").attr("src");
        const existing = cart.find(item => item.name === name);
        if (existing) existing.quantity++;
        else cart.push({ name: name, price: price, image: image, quantity: 1 });
        renderCart();
        const oldText = $button.html();
        $button.html('<i class="bi bi-check2"></i> Added').removeClass("btn-dark").addClass("btn-success");
        setTimeout(function () { $button.html(oldText).removeClass("btn-success").addClass("btn-dark"); }, 900);
    });

    $("#checkoutButton").on("click", function () {
        if (!cart.length) { alert("Your cart is empty. Please add a product first."); return; }
        alert("This is a demo store. A real checkout and payment gateway must be connected to place an order.");
    });

    function applyTheme(dark) {
        $("body").toggleClass("dark-mode", dark);
        $("#themeIcon").attr("class", dark ? "bi bi-sun" : "bi bi-moon-stars");
        $("#themeToggle").attr("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
        try { localStorage.setItem("styleHubTheme", dark ? "dark" : "light"); } catch (e) {}
    }
    let savedTheme = "light";
    try { savedTheme = localStorage.getItem("styleHubTheme") || "light"; } catch (e) {}
    applyTheme(savedTheme === "dark");
    $("#themeToggle").on("click", function () { applyTheme(!$("body").hasClass("dark-mode")); });

    $("#loginForm").on("submit", function (event) {
        event.preventDefault();
        const email = $("#loginEmail").val().trim();
        const password = $("#loginPassword").val();
        if (email.indexOf("@") === -1 || password.length < 8) {
            alert("Enter a valid email and a password of at least 8 characters."); return;
        }
        $("#authSuccess").text("Login form validated for demo purposes. No server authentication was performed.").removeClass("d-none");
    });

    $("#signupForm").on("submit", function (event) {
        event.preventDefault();
        const email = $("#signupEmail").val().trim();
        const password = $("#signupPassword").val();
        const confirm = $("#confirmPassword").val();
        let message = "";
        if (email.indexOf("@") === -1) message = "Please enter a valid email address.";
        else if (password.length < 8) message = "Password must be at least 8 characters long.";
        else if (password !== confirm) message = "Password and confirm password do not match.";
        $("#signupError").text(message);
        if (message) return;
        $("#authSuccess").text("Sign-up form validated successfully for demo purposes. No account was saved to a server.").removeClass("d-none");
        this.reset();
    });

    $("#newsletterForm").on("submit", function (event) {
        event.preventDefault();
        $("#newsletterMessage").removeClass("text-danger").addClass("text-success").text("Thanks for subscribing! This demo does not send or store emails.");
        this.reset();
    });

    $("#authModal").on("hidden.bs.modal", function () {
        $("#authSuccess").addClass("d-none");
        $("#signupError").text("");
    });

    renderProducts(1, false);
    renderCart();
});


  function log() {
    var loguser = document.getElementById("loguser");
    var logemail = document.getElementById("logemail");
    var logpassword = document.getElementById("logpassword");

    let check = 0;

    if (loguser.value.length > 20 || loguser.value.length < 3) {
        loguser.classList.remove("is-valid");
        loguser.classList.add("is-invalid");
    } else {
        loguser.classList.remove("is-invalid");
        loguser.classList.add("is-valid");
        check++;
    }

    if (logemail.value.includes("@")) {
        logemail.classList.add("is-valid");
        logemail.classList.remove("is-invalid");
        check++;
    } else {
        logemail.classList.add("is-invalid");
        logemail.classList.remove("is-valid");
    }
    if (logpassword.value.length > 3) {
        logpassword.classList.add("is-valid");
        logpassword.classList.remove("is-invalid");
        check++;
    } else {
        logpassword.classList.add("is-invalid");
        logpassword.classList.remove("is-valid");
    }

    if (check === 3) {
        alert("You have logged in");
    } else {
        alert("Fill all the fields before submitting");
    }
}
function sign() {
    var signuser = document.getElementById("signuser");
    var signemail = document.getElementById("signemail");
    var signpassword = document.getElementById("signpassword");
    var signconpassword = document.getElementById("signconpassword");
    let check = 0;
    if (signuser.value.length > 20 || signuser.value.length < 3) {
        signuser.classList.remove("is-valid");
        signuser.classList.add("is-invalid");
    } else {
        signuser.classList.remove("is-invalid");
        signuser.classList.add("is-valid");
        check++;
    }
    if (signemail.value.includes("@")) {
        signemail.classList.remove("is-invalid");
        signemail.classList.add("is-valid");
        check++;
    } else {
        signemail.classList.remove("is-valid");
        signemail.classList.add("is-invalid");
    }
    if (signpassword.value.length > 3) {
        signpassword.classList.remove("is-invalid");
        signpassword.classList.add("is-valid");
        check++;
    } else {
        signpassword.classList.remove("is-valid");
        signpassword.classList.add("is-invalid");
    }

    if (
        signconpassword.value.length > 3 &&
        signconpassword.value === signpassword.value
    ) {
        signconpassword.classList.remove("is-invalid");
        signconpassword.classList.add("is-valid");
        check++;
    } else {
        signconpassword.classList.remove("is-valid");
        signconpassword.classList.add("is-invalid");
    }
    if (check === 4) {
        alert("You have signed up");
    } else {
        alert("Fill all the fields correctly before submitting");
    }
}