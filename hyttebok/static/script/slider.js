const img_items = document.querySelectorAll('.landing-page-image');
const itemCount = img_items.length;
const nextSlide = document.querySelector(".btn-next");
console.log("All images on landing page: " + img_items[0]);
console.log("Count items: " + itemCount);
let count = 0;

function selectNextImage(event) {
    event.preventDefault();
    img_items[count].classList.remove('active');

    if(count < itemCount - 1 ) {
        count++;
    } else {
        count = 0;
    }

    img_items[count].classList.add('active');
    console.log("Count: " + count);
}

function selectPrevImage(event) {
    event.preventDefault();
    img_items[count].classList.remove('active');

    if(count > 0) {
        count--;
    } else {
        count = itemCount-1;
    }

    img_items[count].classList.add('active');
    console.log("Count: " + count);
}
