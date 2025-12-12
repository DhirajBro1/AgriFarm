import pandas as pd
import datetime
import difflib
import re


df = pd.read_csv("clean.csv")

nepali_to_english_dates_conversion = {
    "Baisakh": (4, 14),
    "Jestha": (5, 15),
    "Ashad": (6, 15),
    "Shrawan": (7, 16),
    "Bhadra": (8, 17),
    "Ashwin": (9, 17),
    "Kartik": (10, 18),
    "Mangsir": (11, 17),
    "Poush": (12, 16),
    "Magh": (1, 15),
    "Falgun": (2, 14),
    "Chaitra": (3, 15)
}


def _normalize_nepali_month(name):
    
    if not name:
        raise ValueError("Empty month name")
    clean = name.strip()
    # try exact case-insensitive match
    for key in nepali_to_english_dates_conversion.keys():
        if clean.lower() == key.lower():
            return key

   
    aliases = {
        'asoj': 'Ashwin',
        'ashoj': 'Ashwin',
        'aswin': 'Ashwin',
        'baishakh': 'Baisakh',
        'baishak': 'Baisakh',
        'baisakh': 'Baisakh'
    }
    low = clean.lower()
    if low in aliases:
        return aliases[low]

    # try approximate match
    keys = list(nepali_to_english_dates_conversion.keys())
    matches = difflib.get_close_matches(clean, keys, n=1, cutoff=0.5)
    if matches:
        return matches[0]

    # try startswith match for short variants
    for key in keys:
        if key.lower().startswith(low[:3]):
            return key

    raise ValueError(f"Unrecognized Nepali month name: '{name}'")

def get_nepali_sowing_dates(nep_range):
   
   
    if not nep_range or not isinstance(nep_range, str):
        return []

   
    s = re.sub(r"[—-−–]", "–", nep_range.strip())

    low = s.lower()
    if "not recommend" in low or low in ("n/a", "na", "none", "not recommended"):
        return []

    months = s.split("–")
   
    if len(months) < 2:
        return []

    start_month_nep = months[0].strip()
    end_month_nep = months[1].split("(")[0].strip()

 
    start_month_nep_key = _normalize_nepali_month(start_month_nep)
    end_month_nep_key = _normalize_nepali_month(end_month_nep)

    start_month_eng, start_day = nepali_to_english_dates_conversion[start_month_nep_key]
    end_month_eng, end_day = nepali_to_english_dates_conversion[end_month_nep_key]
    
    today = datetime.date.today()
    current_year = today.year
    
    crosses_year = end_month_eng < start_month_eng
    
   
    start1 = datetime.date(current_year, start_month_eng, start_day)
    end1_year = current_year + 1 if crosses_year else current_year
    end1 = datetime.date(end1_year, end_month_eng, end_day)
    
   
    start2_year = current_year - 1
    start2 = datetime.date(start2_year, start_month_eng, start_day)
    end2_year = current_year if crosses_year else current_year - 1
    end2 = datetime.date(end2_year, end_month_eng, end_day)
    
   
    if start1 <= today <= end1:
        start_date, end_date = start1, end1
    elif start2 <= today <= end2:
        start_date, end_date = start2, end2
    else:
       
        start_date, end_date = start1, end1
    
    delta = (end_date - start_date).days
    return [start_date + datetime.timedelta(days=i) for i in range(delta + 1)]

def get_crops_for_place(place_name):
    place_name = place_name.lower()
    if "high" in place_name:
        col = "High_Hill_Sowing"
    elif "mid" in place_name:
        col = "Mid_Hill_Sowing"
    elif "terai" in place_name or "bensi" in place_name:
        col = "Terai_Bensi_Sowing"
    else:
        return None, "Place not recognized"
    
    crops = df[df[col].notna()]
    
   
    result = {}
    for idx, row in crops.iterrows():
        sowing_range = row[col]
        try:
            dates = get_nepali_sowing_dates(sowing_range)
        except Exception as e:
           
            return None, f"Error parsing sowing range '{sowing_range}': {e}"
        result[f"{row['Crop']} - {row['Variety']}"] = dates
    
    return result, None