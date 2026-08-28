import requests
import cv2
import numpy as np

# Test Clean Document
clean = np.full((360, 600, 3), 30, dtype=np.uint8)
cv2.rectangle(clean, (20, 20), (580, 340), (240, 240, 240), -1)
cv2.putText(clean, 'STATE IDENTITY AUTHORITY', (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 20, 20), 2)
cv2.rectangle(clean, (40, 90), (180, 270), (100, 100, 100), -1)
cv2.putText(clean, 'NAME: ALEXANDRA RIVERA', (210, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (30, 30, 30), 2)
cv2.putText(clean, 'DOB: 14/08/1998', (210, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (30, 30, 30), 2)
cv2.putText(clean, 'DOC NO: ID-8849201-X', (210, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (30, 30, 30), 2)
_, buf_clean = cv2.imencode('.png', clean)

# Test Altered Document (Spliced Name)
altered = clean.copy()
cv2.rectangle(altered, (205, 100), (490, 135), (255, 230, 230), -1)
cv2.putText(altered, 'NAME: RAHUL KUMAR [MODIFIED]', (210, 125), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 220), 2)
_, buf_altered = cv2.imencode('.png', altered)

r_clean = requests.post('http://127.0.0.1:8000/api/detect', files={'file': ('clean.png', buf_clean.tobytes(), 'image/png')})
print('CLEAN STATUS:', r_clean.status_code)
c_data = r_clean.json()
print('CLEAN INDICATORS:', c_data['manipulation_indicators'], '| REGIONS:', len(c_data['suspicious_regions']), '| STATUS:', c_data['document_status'])

r_altered = requests.post('http://127.0.0.1:8000/api/detect', files={'file': ('altered.png', buf_altered.tobytes(), 'image/png')})
print('ALTERED STATUS:', r_altered.status_code)
a_data = r_altered.json()
print('ALTERED INDICATORS:', a_data['manipulation_indicators'], '| OVERALL SUSPICION:', a_data['overall_suspicion'], '| REGIONS:', len(a_data['suspicious_regions']))
for reg in a_data['suspicious_regions']:
    print(f"-> {reg['id']} ({reg['field']} / {reg['location_label']}) Score: {reg['suspicion_score']} Severity: {reg['severity']}")
    print(f"   BBox: x={reg['x']}, y={reg['y']}, w={reg['width']}, h={reg['height']}")
    print(f"   Evidence: {reg['indicators']}")
