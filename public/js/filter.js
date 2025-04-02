const filtersContainer = document.getElementById("filters");
const leftBtn = document.querySelector(".scroll-btn.left");
const rightBtn = document.querySelector(".scroll-btn.right");

function checkScrollButtons() {
    // Check if at the start of the scroll
    if (filtersContainer.scrollLeft <= 0) {
        leftBtn.classList.add("hidden");
    } else {
        leftBtn.classList.remove("hidden");
    }

    // Check if scrolled to the end
    if (
        filtersContainer.scrollLeft + filtersContainer.clientWidth >=
        filtersContainer.scrollWidth - 1
    ) {
        rightBtn.classList.add("hidden");
    } else {
        rightBtn.classList.remove("hidden");
    }
}

function scrollFilters(value) {
    filtersContainer.scrollBy({ left: value, behavior: "smooth" });

    // Add a small delay to check buttons after scrolling
    setTimeout(checkScrollButtons, 300);
}

// Listen to scroll event
filtersContainer.addEventListener("scroll", checkScrollButtons);

// Initial check when page loads
document.addEventListener("DOMContentLoaded", checkScrollButtons);

let taxSwitch = document.getElementById("flexSwitchCheckDefault");
taxSwitch.addEventListener("click", () => {
    let taxInfo = document.getElementsByClassName("tax-info");
    for (let info of taxInfo) {
        if (info.style.display != "inline") {
            info.style.display = "inline";
        } else {
            info.style.display = "none";
        }
    }
});