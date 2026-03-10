"""
Train an EfficientNet-B0 classifier for soybean seed classification
Dataset structure:
dataset/
  Broken soybeans/
  Immature soybeans/
  Intact soybeans/
  Skin-damaged soybeans/
  Spotted soybeans/
Outputs best_seed_model.pth
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from torch.optim.lr_scheduler import ReduceLROnPlateau
import os
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

# Configuration
DATA_DIR = "../dataset"  # Adjust if different
OUTPUT_MODEL = "best_seed_model.pth"
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 30
NUM_CLASSES = 5
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Class names (should match folder names)
CLASS_NAMES = [
    "Broken soybeans",
    "Immature soybeans",
    "Intact soybeans",
    "Skin-damaged soybeans",
    "Spotted soybeans"
]

def create_transforms():
    """Create data transforms for training and validation"""
    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    return train_transform, val_transform

def create_data_loaders():
    """Create data loaders for training and validation"""
    train_transform, val_transform = create_transforms()
    
    # Load datasets
    full_dataset = datasets.ImageFolder(root=DATA_DIR, transform=train_transform)
    
    # Split dataset
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(
        full_dataset, [train_size, val_size]
    )
    
    # Update transform for validation set
    val_dataset.dataset.transform = val_transform
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset, 
        batch_size=BATCH_SIZE, 
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )
    
    print(f"Training samples: {len(train_dataset)}")
    print(f"Validation samples: {len(val_dataset)}")
    
    return train_loader, val_loader, full_dataset.classes

def create_model():
    """Create EfficientNet-B0 model"""
    model = models.efficientnet_b0(weights='IMAGENET1K_V1')
    
    # Freeze early layers
    for param in model.parameters():
        param.requires_grad = False
    
    # Replace classifier
    num_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_features, NUM_CLASSES)
    
    return model.to(DEVICE)

def train_epoch(model, loader, criterion, optimizer):
    """Train for one epoch"""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    pbar = tqdm(loader, desc='Training')
    for inputs, labels in pbar:
        inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
        
        pbar.set_postfix({'loss': running_loss/total, 'acc': 100.*correct/total})
    
    return running_loss/len(loader), 100.*correct/total

def validate(model, loader, criterion):
    """Validate the model"""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        pbar = tqdm(loader, desc='Validation')
        for inputs, labels in pbar:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
            pbar.set_postfix({'loss': running_loss/total, 'acc': 100.*correct/total})
    
    return running_loss/len(loader), 100.*correct/total, all_preds, all_labels

def plot_training_history(train_losses, val_losses, train_accs, val_accs):
    """Plot training history"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    
    # Plot loss
    ax1.plot(train_losses, label='Train Loss')
    ax1.plot(val_losses, label='Val Loss')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('Training and Validation Loss')
    ax1.legend()
    ax1.grid(True)
    
    # Plot accuracy
    ax2.plot(train_accs, label='Train Acc')
    ax2.plot(val_accs, label='Val Acc')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Accuracy (%)')
    ax2.set_title('Training and Validation Accuracy')
    ax2.legend()
    ax2.grid(True)
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    plt.show()

def main():
    print("="*60)
    print("🚀 TRAINING SOYBEAN SEED CLASSIFICATION MODEL")
    print("="*60)
    print(f"Device: {DEVICE}")
    print(f"Classes: {CLASS_NAMES}")
    
    # Create data loaders
    train_loader, val_loader, class_names = create_data_loaders()
    
    # Create model
    model = create_model()
    print(f"Model created with {sum(p.numel() for p in model.parameters())} parameters")
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.1, patience=3)
    
    # Training history
    train_losses, val_losses = [], []
    train_accs, val_accs = [], []
    best_val_acc = 0.0
    
    # Training loop
    print("\n" + "="*60)
    print("📊 STARTING TRAINING")
    print("="*60)
    
    for epoch in range(EPOCHS):
        print(f"\nEpoch {epoch+1}/{EPOCHS}")
        print("-"*40)
        
        # Train
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer)
        train_losses.append(train_loss)
        train_accs.append(train_acc)
        
        # Validate
        val_loss, val_acc, preds, labels = validate(model, val_loader, criterion)
        val_losses.append(val_loss)
        val_accs.append(val_acc)
        
        # Update learning rate
        scheduler.step(val_loss)
        
        print(f"\nTrain Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
        print(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), OUTPUT_MODEL)
            print(f"✅ Saved best model with accuracy: {best_val_acc:.2f}%")
    
    print("\n" + "="*60)
    print(f"🏆 Best Validation Accuracy: {best_val_acc:.2f}%")
    print("="*60)
    
    # Load best model for final evaluation
    model.load_state_dict(torch.load(OUTPUT_MODEL))
    
    # Final validation
    _, _, final_preds, final_labels = validate(model, val_loader, criterion)
    
    # Classification report
    print("\n📋 Classification Report:")
    print(classification_report(final_labels, final_preds, target_names=class_names))
    
    # Plot training history
    plot_training_history(train_losses, val_losses, train_accs, val_accs)
    
    print(f"\n✅ Model saved to {OUTPUT_MODEL}")

if __name__ == "__main__":
    main()