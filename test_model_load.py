#!/usr/bin/env python3
"""Test model loading approaches"""

import os
import torch

h5_path = 'static/model/model_combined_best.weights.h5'

print(f"Testing model file: {h5_path}")
print(f"File exists: {os.path.exists(h5_path)}")

# Try to load it as a PyTorch file (might fail)
try:
    print("\nAttempting torch.load()...")
    result = torch.load(h5_path, map_location='cpu')
    print(f"Success! Type: {type(result)}")
    if isinstance(result, dict):
        print(f"Keys: {list(result.keys())[:10]}")  # First 10 keys
except Exception as e:
    print(f"Failed: {e}")

# Try to understand file format by reading first few bytes
try:
    print("\nReading file header...")
    with open(h5_path, 'rb') as f:
        header = f.read(20)
        print(f"First 20 bytes (hex): {header.hex()}")
        print(f"First 20 bytes (ascii): {header}")
except Exception as e:
    print(f"Failed: {e}")
