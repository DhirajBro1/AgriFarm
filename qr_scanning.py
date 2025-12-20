import cv2
from pyzbar.pyzbar import decode
from for_qr_to_work import get_food_info

cap=cv2.VideoCapture(0)
last_scaned=None
code_data = None
if not cap.isOpened():
    print("camera not found or cannot be opened")
    exit()
def main():
    while True:
        ret,frame=cap.read()
        if not ret:
            print("failed to grab frame")
            break
        height, width, _ = frame.shape
        center_x, center_y = width // 2, height // 2
        cv2.rectangle(frame, (center_x - 100, center_y - 100), (center_x + 120, center_y + 120), (255, 255, 255), 1)
        cv2.putText(frame, "Place QR/barcode inside the box", (center_x - 60, center_y - 140), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        frame = cv2.flip(frame, 1)
        codes=decode(frame)
        for barcode in codes:
            x,y,w,h=barcode.rect
            cv2.rectangle(frame,(x,y),(x+w,y+h),(0,255,0),2)
            code_data=barcode.data.decode('utf-8')
            if code_data !=last_scaned:
                food = get_food_info(code_data)
                last_scaned=code_data
                if food:
                    print(f"Product: {food['name']}")
                else:
                    print(f"Code {code_data} not found in database")

            if last_scaned == code_data and 'food' in locals() and food:
                cv2.putText(frame,f"Product: {food['name']}",(x,y-10),cv2.FONT_HERSHEY_SIMPLEX,0.5,(0,255,0),2)         

            if food:
                print(f"Product: {food['name']}")
                print(f"Ingredients: {food['ingredients']}")
                print(f"Calories per 100g: {food['calories_per_100g']}")
            else:
                print(f"Code {code_data} not found in database")
        cv2.imshow("OR + barcode scanner",frame)
        if cv2.waitKey(1) & 0xFF==ord('q'):
            break
if __name__=="__main__":
    try:
        main()
    finally:
        cap.release()
        cv2.destroyAllWindows()
