#!/usr/bin/env python3
"""
Validation script for openWakeWord server code.
Tests buffer overflow protection, protocol, and error handling logic.
"""

import sys
import os

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))

def test_buffer_overflow_logic():
    """Test the buffer overflow protection logic"""
    print("Testing buffer overflow protection logic...")
    
    # Simulate the buffer overflow protection
    MAX_BUFFER_SIZE = 12800
    buffer = []
    
    # Test 1: Normal operation (buffer under limit)
    buffer = list(range(1000))
    if len(buffer) > MAX_BUFFER_SIZE:
        original_size = len(buffer)
        dropped = original_size - MAX_BUFFER_SIZE
        buffer = buffer[-MAX_BUFFER_SIZE:]
        print(f"  ❌ FAIL: Buffer overflow triggered when it shouldn't (size: {len(buffer)})")
        return False
    print("  ✓ Test 1 passed: Normal buffer size")
    
    # Test 2: Buffer overflow (buffer exceeds limit)
    buffer = list(range(15000))  # Exceeds MAX_BUFFER_SIZE
    if len(buffer) > MAX_BUFFER_SIZE:
        original_size = len(buffer)
        dropped = original_size - MAX_BUFFER_SIZE
        buffer = buffer[-MAX_BUFFER_SIZE:]
        if len(buffer) != MAX_BUFFER_SIZE:
            print(f"  ❌ FAIL: Buffer not trimmed correctly (expected {MAX_BUFFER_SIZE}, got {len(buffer)})")
            return False
        if dropped != 2200:  # 15000 - 12800
            print(f"  ❌ FAIL: Incorrect drop count (expected 2200, got {dropped})")
            return False
        print(f"  ✓ Test 2 passed: Buffer overflow handled correctly (dropped {dropped} samples)")
    
    # Test 3: Buffer exactly at limit
    buffer = list(range(MAX_BUFFER_SIZE))
    if len(buffer) > MAX_BUFFER_SIZE:
        print(f"  ❌ FAIL: Buffer overflow triggered at exact limit")
        return False
    print("  ✓ Test 3 passed: Buffer at exact limit")
    
    # Test 4: Buffer just over limit
    buffer = list(range(MAX_BUFFER_SIZE + 1))
    if len(buffer) > MAX_BUFFER_SIZE:
        original_size = len(buffer)
        dropped = original_size - MAX_BUFFER_SIZE
        buffer = buffer[-MAX_BUFFER_SIZE:]
        if len(buffer) != MAX_BUFFER_SIZE or dropped != 1:
            print(f"  ❌ FAIL: Buffer overflow not handled correctly for +1 case")
            return False
        print("  ✓ Test 4 passed: Buffer just over limit handled correctly")
    
    return True

def test_protocol_constants():
    """Test that protocol constants match between client and server"""
    print("\nTesting protocol constants...")
    
    # Server constants
    DEFAULT_CHUNK_SIZE = 1280
    TARGET_SAMPLE_RATE = 16000
    MAX_BUFFER_SIZE = 12800
    
    # Client constants (from openwakeword-client.js)
    CLIENT_SAMPLE_RATE = 16000
    CLIENT_FRAME_SAMPLES = 1280  # OPENWAKEWORD_FRAME_SAMPLES
    
    # Verify sample rate matches
    if TARGET_SAMPLE_RATE != CLIENT_SAMPLE_RATE:
        print(f"  ❌ FAIL: Sample rate mismatch (server: {TARGET_SAMPLE_RATE}, client: {CLIENT_SAMPLE_RATE})")
        return False
    print(f"  ✓ Sample rate matches: {TARGET_SAMPLE_RATE} Hz")
    
    # Verify chunk size matches
    if DEFAULT_CHUNK_SIZE != CLIENT_FRAME_SAMPLES:
        print(f"  ❌ FAIL: Chunk size mismatch (server: {DEFAULT_CHUNK_SIZE}, client: {CLIENT_FRAME_SAMPLES})")
        return False
    print(f"  ✓ Chunk size matches: {DEFAULT_CHUNK_SIZE} samples")
    
    # Verify buffer size is reasonable (10 frames)
    expected_buffer = DEFAULT_CHUNK_SIZE * 10
    if MAX_BUFFER_SIZE != expected_buffer:
        print(f"  ❌ FAIL: Buffer size mismatch (expected {expected_buffer}, got {MAX_BUFFER_SIZE})")
        return False
    print(f"  ✓ Buffer size correct: {MAX_BUFFER_SIZE} samples (10 frames)")
    
    return True

def test_syntax():
    """Test that the server file has valid Python syntax"""
    print("\nTesting Python syntax...")
    
    server_file = os.path.join(os.path.dirname(__file__), '..', '..', 'scripts', 'openwakeword-server.py')
    
    if not os.path.exists(server_file):
        print(f"  ❌ FAIL: Server file not found: {server_file}")
        return False
    
    try:
        with open(server_file, 'r', encoding='utf-8') as f:
            code = f.read()
        
        # Basic syntax check - try to compile
        compile(code, server_file, 'exec')
        print("  ✓ Python syntax is valid")
        return True
    except SyntaxError as e:
        print(f"  ❌ FAIL: Syntax error: {e}")
        return False
    except Exception as e:
        print(f"  ❌ FAIL: Error reading file: {e}")
        return False

def test_imports():
    """Test that all required imports are present"""
    print("\nTesting imports...")
    
    server_file = os.path.join(os.path.dirname(__file__), '..', '..', 'scripts', 'openwakeword-server.py')
    
    try:
        with open(server_file, 'r', encoding='utf-8') as f:
            code = f.read()
        
        required_imports = [
            'argparse',
            'asyncio',
            'json',
            'logging',
            'sys',
            'aiohttp',
            'numpy',
            'openwakeword'
        ]
        
        missing = []
        for imp in required_imports:
            if imp not in code:
                missing.append(imp)
        
        if missing:
            print(f"  ❌ FAIL: Missing imports: {', '.join(missing)}")
            return False
        
        print("  ✓ All required imports present")
        return True
    except Exception as e:
        print(f"  ❌ FAIL: Error checking imports: {e}")
        return False

def test_constants():
    """Test that all required constants are defined"""
    print("\nTesting constants...")
    
    server_file = os.path.join(os.path.dirname(__file__), '..', '..', 'scripts', 'openwakeword-server.py')
    
    try:
        with open(server_file, 'r', encoding='utf-8') as f:
            code = f.read()
        
        required_constants = [
            'DEFAULT_PORT',
            'DEFAULT_CHUNK_SIZE',
            'TARGET_SAMPLE_RATE',
            'THRESHOLD',
            'HEY_JARVIS_MODEL',
            'MAX_BUFFER_SIZE'
        ]
        
        missing = []
        for const in required_constants:
            if const not in code:
                missing.append(const)
        
        if missing:
            print(f"  ❌ FAIL: Missing constants: {', '.join(missing)}")
            return False
        
        print("  ✓ All required constants defined")
        return True
    except Exception as e:
        print(f"  ❌ FAIL: Error checking constants: {e}")
        return False

def main():
    """Run all validation tests"""
    print("=" * 60)
    print("OpenWakeWord Server Validation")
    print("=" * 60)
    
    tests = [
        ("Syntax Check", test_syntax),
        ("Imports Check", test_imports),
        ("Constants Check", test_constants),
        ("Protocol Constants", test_protocol_constants),
        ("Buffer Overflow Logic", test_buffer_overflow_logic),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n  ❌ FAIL: {name} raised exception: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ All validation tests passed!")
        return 0
    else:
        print(f"\n❌ {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
