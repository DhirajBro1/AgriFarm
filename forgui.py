from tkinter import *
from tkinter import ttk
from bla_bla_bla import get_crops_for_place

def enter_yourinfo():
    place = entry.get()
    crops, error = get_crops_for_place(place)
    if error:
        result_text.delete("1.0", END)
        result_text.insert(END, error)
        return
    
    result_text.delete("1.0", END)
    for crop, dates in crops.items():
        result_text.insert(END, f"{crop}\n")
        for d in dates:
            result_text.insert(END, f"  {d}\n")
        result_text.insert(END, "\n")

root = Tk()
root.title("Agrifarm GUI")

frm = ttk.Frame(root, padding=10)
frm.grid()

ttk.Label(frm, text="Welcome to Agrifarm").grid(column=0, row=0)
ttk.Label(frm, text="Enter your place name:").grid(column=0, row=1, pady=5)

entry = ttk.Entry(frm)
entry.grid(column=0, row=2, pady=5)

ttk.Button(frm, text="Submit", command=enter_yourinfo).grid(column=0, row=3, pady=5)
ttk.Button(frm, text="Quit", command=root.destroy).grid(column=1, row=0)


result_text = Text(frm, width=50, height=20)
result_text.grid(column=0, row=4, columnspan=2, pady=10)

root.mainloop()

