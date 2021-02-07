class MealAPI {
  constructor() {
    this.mealsCache = [];
  }

  async searchMeals(mealName) {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(mealName)}`);
    const data = await response.json();
    this.mealsCache = data.meals;
    return this.mealsCache;
  }

  static getIngredients(meal) {
    return Object.keys(meal).
      filter(key => /^strIngredient\d+$/.test(key) && meal[key].trim()).
      map(strIngredientN => meal["strMeasure" + strIngredientN.match(/\d+/)[0]] + " " +
                            meal[strIngredientN]);
  }

  getCachedMealById(id) {
    return this.mealsCache.filter(meal => meal.idMeal == id)[0] || null;
  }
}

class MealDrawingEngine {
  constructor(mealContainer, ingredientsContainer) {
    this.mealsContainer = mealContainer;
    this.ingredientsContainer = ingredientsContainer;
  }

  showMeals(meals) {
    this.mealsContainer.innerHTML = "";
    this.mealsContainer.innerHTML = `
    ${(meals || []).map(meal => `
      <div id="${meal.idMeal}" class="meal" style="background-image: url('${meal.strMealThumb}')">
        <h3>${meal.strMeal}</h3>
      </div>
    `).join``}`;

    if (meals == null) this.mealsContainer.innerHTML = "Sorry, no matching meals found. Try something different.";
  }

  showIngredients(meal) {
    const ingredients = MealAPI.getIngredients(meal);
    const title = meal.strMeal;
    this.ingredientsContainer.innerHTML = "";
    this.ingredientsContainer.classList.remove("ingredients-closed");

    this.ingredientsContainer.innerHTML = `
    <div id="close-ingredients-btn"><i class="fas fa-times-circle"></i></div>
    <img src="${meal.strMealThumb}" alt="${title}">
    <h2>${title}</h2>
    <ul>
      ${ingredients.map(item => `<li class="ingredient">${item}</li>`).join``}
    </ul>`;

    const closeBtn = this.ingredientsContainer;
    closeBtn.querySelector("#close-ingredients-btn").onclick = () => {
      this.ingredientsContainer.classList.add("ingredients-closed");
    }
  }

}

const getElt = query => document.querySelector(query);
const form = getElt("form");
const mealsContainer = getElt("#meals");
const ingredientsContainer = getElt("#ingredients");
const mealAPI = new MealAPI();
const painter = new MealDrawingEngine(mealsContainer, ingredientsContainer)

form.addEventListener("submit", async event => {
  event.preventDefault();
  mealsContainer.innerHTML = "Loading...";

  let meals;
  try {
    meals = await mealAPI.searchMeals(form.elements[0].value);
    painter.showMeals(meals);
  } catch(err) {
    mealsContainer.innerHTML = `Something went wrong.`;
  }
})

mealsContainer.onclick = event => {
  const mealContainer = event.target.closest(".meal");
  if (!mealContainer) return;
  painter.showIngredients(mealAPI.getCachedMealById(mealContainer.id));
}
