# Real-World Cryptography

**Author**: David Wong  
**Publisher**: Manning Publications (2021)  
**Status**: Available via Manning, libraries, or purchase

---

## Overview

A practical guide to cryptography for developers. Covers modern cryptographic techniques, API key protection strategies, secure WebSocket connections, authentication token handling, and encryption for sensitive data.

---

## Key Concepts Relevant to JARVIS-WEB

### 1. API Key Protection

- Secure key storage and transmission
- **Applied**:
  - API key environment variables
  - Never hardcode keys
  - Secure key management

### 2. Secure WebSocket Connections

- TLS/WSS for WebSocket security
- **Applied**:
  - HTTPS requirement for production
  - WSS protocol for WebSocket connections

### 3. Authentication Tokens

- Token-based authentication
- **Applied**:
  - API key as authentication token
  - Token validation

### 4. Encryption for Sensitive Data

- Encrypting sensitive data in transit
- **Applied**:
  - HTTPS for all connections
  - Secure WebSocket connections

---

## Key Topics Relevant to JARVIS-WEB

### API Key Security

- Key storage best practices
- Key transmission security
- **Applied**: Environment variable storage

### WebSocket Security

- TLS/WSS implementation
- Secure connection establishment
- **Applied**: HTTPS requirement

### Data Protection

- Encrypting sensitive data
- **Applied**: HTTPS enforcement

---

## Security Principles from This Book

1. **Use Established Cryptography**
   - Don't roll your own crypto
   - Applied in using HTTPS/TLS

2. **Protect Keys Properly**
   - Secure key storage and transmission
   - Applied in API key management

3. **Encrypt in Transit**
   - Always use encryption for network traffic
   - Applied in HTTPS requirement

---

## Implementation Status

✅ **Partially Implemented**:

- API key security practices
- HTTPS enforcement
- Secure connection requirements

📋 **Recommended** (from this book):

- Advanced key management
- Token-based authentication
- End-to-end encryption for sensitive data

---

## Access Information

**Free Access**:

- Manning Free Content Center - Free chapters available
- Public libraries - Check digital library access
- O'Reilly Learning Platform (with subscription)

**Purchase**:

- Manning Publications (official publisher)
- Amazon, Barnes & Noble
- ~$40-50 USD

---

## Related Resources

- Applied Cryptography (Bruce Schneier)
- Cryptography Engineering (Ferguson, Schneier, Kohno)
- OWASP Cryptographic Storage Cheat Sheet

---

*This book provides cryptographic foundations for secure API key management and WebSocket security in JARVIS-WEB.*
