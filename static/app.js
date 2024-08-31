// Global variable to store the chart instance
let macroChart;

// Function to draw the chart using Chart.js
function drawChart(protein = 0, fat = 0, carbs = 0, goalProtein = 0, goalFat = 0, goalCarbs = 0) {
    const ctx = document.getElementById('macroChart').getContext('2d');
    if (macroChart) {
        macroChart.destroy();
    }
    macroChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Protein', 'Fat', 'Carbs'],
            datasets: [
                {
                    label: 'Actual',
                    data: [protein, fat, carbs],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Goal',
                    data: [goalProtein, goalFat, goalCarbs],
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to calculate macros
const calculateMacros = (weightLbs, heightFt, heightIn, age, gender, activityLevel) => {
    const heightCm = (heightFt * 12 + heightIn) * 2.54;
    const weightKg = weightLbs * 0.453592;
    let bmr;

    if (gender === 'Male') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    const totalCalories = Math.round(bmr * activityLevel);
    const protein = Math.round(totalCalories * 0.30 / 4);
    const fat = Math.round(totalCalories * 0.25 / 9);
    const carbs = Math.round(totalCalories * 0.45 / 4);

    return {
        totalCalories,
        protein,
        fat,
        carbs
    };
};

// Function to make an API request with an OAuth 2.0 token
const fetchProtectedData = async () => {
    const accessToken = 'YOUR_OAUTH_ACCESS_TOKEN'; // Replace with the actual token obtained after login

    try {
        const response = await fetch('/api/protected-data', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch protected data');
        }

        const data = await response.json();
        console.log(data); // Process and use the data in your application
    } catch (error) {
        console.error('Error fetching protected data:', error);
    }
};

// Example usage of fetchProtectedData function
fetchProtectedData();

// Fetch data from an API or generate it
fetch('/api/data')
  .then(response => response.json())
  .then(data => {
    // Assuming 'data' is in the correct format for Chart.js
    const formattedData = {
        labels: ['Protein', 'Fat', 'Carbs'],
        datasets: [
            {
                label: 'Actual',
                data: data.actual,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: 'Goal',
                data: data.goal,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }
        ]
    };
    drawChart(formattedData);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });

// Function to search for foods by macronutrient category
const searchFoodsByCategory = async (query, maxResults = 20) => {
    const API_KEY = 'cZd0PA6DDKKkY6i4yr5fbbOUSJmtx41Nc4HCXbre';
    
    try {
        const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${query}&pageSize=50&dataType=Survey%20(FNDDS),Foundation`);
        const data = await response.json();

        // Sort results by the specific nutrient content (e.g., protein for protein category)
        const sortedFoods = data.foods.sort((a, b) => {
            const nutrientA = getNutrientValue(a, 'Protein'); // Change 'Protein' to the relevant nutrient for sorting
            const nutrientB = getNutrientValue(b, 'Protein');
            return nutrientB - nutrientA; // Sort in descending order
        });

        // Return the top maxResults items
        return sortedFoods.slice(0, maxResults);
    } catch (error) {
        console.error(`Error fetching ${query} foods: `, error);
        return [];
    }
};

// Helper function to get nutrient values from a food item
const getNutrientValue = (food, nutrientName) => {
    const nutrient = food.foodNutrients.find(nutrient => nutrient.nutrientName === nutrientName);
    return nutrient ? Math.round(nutrient.value) : 0;
};

// Populate dropdowns
const populateDropdowns = async () => {
    const proteinFoods = await searchFoodsByCategory('protein', 20);
    const fatFoods = await searchFoodsByCategory('fat', 20);
    const carbFoods = await searchFoodsByCategory('carbohydrate', 20);

    populateDropdown('protein-dropdown', proteinFoods);
    populateDropdown('fat-dropdown', fatFoods);
    populateDropdown('carbs-dropdown', carbFoods);
};

// Function to populate a dropdown menu
const populateDropdown = (dropdownId, foods) => {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = ''; // Clear existing options

    foods.forEach((food) => {
        const option = document.createElement('option');
        const protein = getNutrientValue(food, 'Protein');
        const fat = getNutrientValue(food, 'Total lipid (fat)');
        const carbs = getNutrientValue(food, 'Carbohydrate, by difference');
        option.value = JSON.stringify({description: food.description, protein, fat, carbs});
        option.text = `${food.description} - Protein: ${protein}g, Fat: ${fat}g, Carbs: ${carbs}g`;
        dropdown.add(option);
    });
};

// Logic to save and display meals for each day of the week
const weeklyMeals = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
};

let selectedDay = 'Monday'; // Default to Monday

// Event listener for day selection
document.querySelectorAll('.day-button').forEach(button => {
    button.addEventListener('click', function() {
        selectedDay = this.textContent; // Set selected day
        displayMealsForDay(selectedDay); // Display meals for the selected day
        updateMealSummary(); // Update the meal summary and chart
    });
});

// Function to display meals for a selected day
const displayMealsForDay = (day) => {
    const mealList = document.getElementById('meal-list');
    mealList.innerHTML = ''; // Clear existing meals
    const meals = weeklyMeals[day];
    if (meals.length === 0) {
        mealList.textContent = 'No meals added for ' + day;
    } else {
        meals.forEach((meal, index) => {
            const mealItem = document.createElement('li');
            mealItem.classList.add('list-group-item');
            mealItem.textContent = `Meal ${index + 1}: ${meal.description}`;
            mealList.appendChild(mealItem);
        });
    }
};

// Function to update the meal summary and chart
const updateMealSummary = () => {
    const totalProtein = weeklyMeals[selectedDay].reduce((acc, meal) => acc + meal.protein, 0);
    const totalFat = weeklyMeals[selectedDay].reduce((acc, meal) => acc + meal.fat, 0);
    const totalCarbs = weeklyMeals[selectedDay].reduce((acc, meal) => acc + meal.carbs, 0);

    document.getElementById('summary-protein').textContent = totalProtein.toFixed(1);
    document.getElementById('summary-fat').textContent = totalFat.toFixed(1);
    document.getElementById('summary-carbs').textContent = totalCarbs.toFixed(1);

    // Get goal values
    const goalProtein = parseFloat(document.getElementById('goal-protein').textContent) || 0;
    const goalFat = parseFloat(document.getElementById('goal-fat').textContent) || 0;
    const goalCarbs = parseFloat(document.getElementById('goal-carbs').textContent) || 0;

    // Update goal summary
    document.getElementById('goal-protein-summary').textContent = goalProtein.toFixed(1);
    document.getElementById('goal-fat-summary').textContent = goalFat.toFixed(1);
    document.getElementById('goal-carbs-summary').textContent = goalCarbs.toFixed(1);

    // Update the chart with the new data
    updateChart(totalProtein, totalFat, totalCarbs, goalProtein, goalFat, goalCarbs);
};

// Function to update the chart using Chart.js
const updateChart = (protein, fat, carbs, goalProtein, goalFat, goalCarbs) => {
    drawChart(protein, fat, carbs, goalProtein, goalFat, goalCarbs);
};

// Event listener for adding a meal
document.getElementById('add-meal').addEventListener('click', () => {
    const proteinDropdown = document.getElementById('protein-dropdown');
    const fatDropdown = document.getElementById('fat-dropdown');
    const carbsDropdown = document.getElementById('carbs-dropdown');
    
    const selectedProtein = JSON.parse(proteinDropdown.value);
    const selectedFat = JSON.parse(fatDropdown.value);
    const selectedCarbs = JSON.parse(carbsDropdown.value);

    // Create a meal object that sums all macronutrients from selected items
    const meal = {
        description: `${selectedProtein.description}, ${selectedFat.description}, ${selectedCarbs.description}`,
        protein: selectedProtein.protein + selectedFat.protein + selectedCarbs.protein,
        fat: selectedProtein.fat + selectedFat.fat + selectedCarbs.fat,
        carbs: selectedProtein.carbs + selectedFat.carbs + selectedCarbs.carbs
    };

    weeklyMeals[selectedDay].push(meal);
    displayMealsForDay(selectedDay);
    updateMealSummary();
});

// Event listener for clearing meals
document.getElementById('clear-meal').addEventListener('click', () => {
    weeklyMeals[selectedDay] = [];
    displayMealsForDay(selectedDay);
    updateMealSummary();
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    populateDropdowns();
    updateMealSummary();
});
