import requests

def get_food_info(barcode):
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    response = requests.get(url)
    try:
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 1:
                product = data['product']
                name = product.get('product_name', 'Unknown')
                ingredients = product.get('ingredients_text', 'N/A')
                nutriments = product.get('nutriments', {})
                calories = nutriments.get('energy-kcal_100g', 'N/A')
                return {
                    "name": name,
                    "ingredients": ingredients,
                    "calories_per_100g": calories
                }
    except requests.exceptions.RequestException as e:
        print(f"Network error fetching barcode {barcode}: {e}")
    except ValueError:
        print("Invalid JSON response")
    return None


