# Design Document: KhethAi

## Overview

KhethAi is a Progressive Web Application (PWA) built with Next.js 14 that provides AI-powered crop disease diagnosis for Indian farmers. The system architecture follows a serverless, offline-first approach with the following key characteristics:

- **Frontend**: Next.js 14 with React Server Components, TypeScript, and Tailwind CSS
- **Backend**: AWS Lambda functions with API Gateway for serverless compute
- **AI/ML**: AWS SageMaker for model training and inference, TensorFlow.js for client-side processing
- **Storage**: Amazon S3 for images, DynamoDB for user data, IndexedDB for offline storage
- **Integrations**: IMD Weather API, eNAM Market API, ISRO Bhuvan Satellite API
- **Deployment**: Vercel for frontend, AWS CloudFormation for infrastructure

The design prioritizes offline functionality, low-bandwidth optimization, and accessibility for low-literacy users through voice interfaces and icon-driven UI.

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        PWA[PWA - Next.js 14]
        SW[Service Worker]
        IDB[IndexedDB]
        TFjs[TensorFlow.js]
    end
    
    subgraph "CDN Layer"
        Vercel[Vercel Edge Network]
        CloudFront[AWS CloudFront]
    end
    
    subgraph "API Layer"
        APIGW[API Gateway]
        Lambda[AWS Lambda Functions]
    end
    
    subgraph "AI/ML Layer"
        SageMaker[SageMaker Endpoint]
        S3Model[Model Storage - S3]
    end
    
    subgraph "Data Layer"
        DynamoDB[(DynamoDB)]
        S3Images[(S3 - Images)]
    end
    
    subgraph "External Services"
        IMD[IMD Weather API]
        eNAM[eNAM Market API]
        Bhuvan[ISRO Bhuvan API]
        SMS[SMS Gateway - Exotel]
    end
    
    PWA --> SW
    SW --> IDB
    PWA --> TFjs
    PWA --> Vercel
    Vercel --> APIGW
    APIGW --> Lambda
    Lambda --> SageMaker
    Lambda --> DynamoDB
    Lambda --> S3Images
    Lambda --> IMD
    Lambda --> eNAM
    Lambda --> Bhuvan
    Lambda --> SMS
    SageMaker --> S3Model

    CloudFront --> S3Images
