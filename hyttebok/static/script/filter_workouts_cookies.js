function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].split("=");
      const cookieName = decodeURIComponent(cookie[0]);
      if (cookieName === name) {
        return decodeURIComponent(cookie[1]);
      }
    }
    return null;
  }

// Function to update the filters and the list of workouts
function updateFiltersAndWorkouts() {
    const category_cookie_value = getCookie("categoryFilter");
    const subcategory_cookie_value = getCookie("subcategoryFilter");
    if ( (category_cookie_value && subcategory_cookie_value) && window.location.pathname === "/workouts") {
        let selectedCategoryElement = document.getElementById("filter-on-category-options");
        let selectedSubcategoryElement = document.getElementById("filter-on-subcategory-options");
        selectedCategoryElement.value=category_cookie_value;
        selectedSubcategoryElement.value=subcategory_cookie_value;
    }
    // call function from script.js
    filterWorkouts();
  }

function handlePageLoad() {
    updateFiltersAndWorkouts();
}

window.addEventListener("load",handlePageLoad);