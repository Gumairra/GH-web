import cv2
from pygrabber.dshow_graph import FilterGraph

for i, name in enumerate(FilterGraph().get_input_devices()):
    print(i, name)
for i in range(3):
    cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
    if not cap.isOpened():
        continue
    print(f"Menampilkan index {i}. Tekan 'q' untuk lanjut ke kamera berikutnya.")
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        cv2.putText(frame, f"DSHOW index {i}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("preview", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    cap.release()
cv2.destroyAllWindows()