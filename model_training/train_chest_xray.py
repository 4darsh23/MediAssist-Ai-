"""
==============================================
  Chest X-Ray Pneumonia Detection — PyTorch
==============================================
Dataset: Kaggle "Chest X-Ray Images (Pneumonia)" by Paul Mooney
URL: https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia

Classes: NORMAL, PNEUMONIA
Architecture: EfficientNet-B0 + Custom Head (Transfer Learning)
Output: ONNX model for browser inference via ONNX Runtime Web

Instructions:
  1. Download dataset from Kaggle and extract to: model_training/datasets/chest_xray/
     Expected structure:
       datasets/chest_xray/
         train/
           NORMAL/
           PNEUMONIA/
         val/
           NORMAL/
           PNEUMONIA/
         test/
           NORMAL/
           PNEUMONIA/

  2. Install requirements: pip install -r requirements.txt
  3. Run: python train_chest_xray.py
"""

import os
import sys
import time
import json
import copy
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, ConcatDataset, random_split
from torchvision import datasets, transforms, models
from sklearn.metrics import classification_report, confusion_matrix
from tqdm import tqdm

# ========================
# Configuration
# ========================
CONFIG = {
    "dataset_dir": os.path.join(os.path.dirname(__file__), "datasets", "chest_xray"),
    "output_dir": os.path.join(os.path.dirname(__file__), "saved_models", "chest_xray"),
    "img_size": 224,
    "batch_size": 32,
    "epochs": 25,
    "learning_rate": 1e-3,
    "fine_tune_epochs": 15,
    "fine_tune_lr": 1e-4,
    "label_smoothing": 0.1,
    "num_workers": 4,
    "class_names": ["NORMAL", "PNEUMONIA"],
}


# ========================
# Data Augmentation
# ========================
def get_transforms():
    """ImageNet-normalized transforms with medical-image-aware augmentation."""
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    train_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomResizedCrop(CONFIG["img_size"], scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(15),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), shear=10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(CONFIG["img_size"]),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    return train_transform, val_transform


# ========================
# Model
# ========================
class ChestXRayClassifier(nn.Module):
    """EfficientNet-B0 based binary classifier for chest X-ray."""

    def __init__(self, num_classes=2):
        super().__init__()
        # Load pretrained EfficientNet-B0
        self.backbone = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)

        # Freeze all backbone layers initially
        for param in self.backbone.features.parameters():
            param.requires_grad = False

        # Replace the classifier head
        in_features = self.backbone.classifier[1].in_features  # 1280
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(in_features, 512),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(512),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(256),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.backbone(x)

    def unfreeze_backbone(self, num_blocks=3):
        """Unfreeze the last N MBConv blocks for fine-tuning."""
        # EfficientNet-B0 has 9 feature blocks (0-8)
        blocks = list(self.backbone.features.children())
        for block in blocks[-num_blocks:]:
            for param in block.parameters():
                param.requires_grad = True
        print(f"   Unfroze last {num_blocks} backbone blocks for fine-tuning")


# ========================
# Training
# ========================
def train_one_epoch(model, dataloader, criterion, optimizer, device, scaler):
    """Train for one epoch with mixed precision."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    pbar = tqdm(dataloader, desc="  Training", leave=False)
    for images, labels in pbar:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()

        # Mixed precision forward pass
        with torch.amp.autocast(device_type="cuda", enabled=(device.type == "cuda")):
            outputs = model(images)
            loss = criterion(outputs, labels)

        # Backward with gradient scaling
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

        running_loss += loss.item() * images.size(0)
        _, predicted = torch.max(outputs, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

        pbar.set_postfix(loss=f"{loss.item():.4f}", acc=f"{correct / total:.4f}")

    return running_loss / total, correct / total


def validate(model, dataloader, criterion, device):
    """Validate model."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)

            with torch.amp.autocast(device_type="cuda", enabled=(device.type == "cuda")):
                outputs = model(images)
                loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    return running_loss / total, correct / total


def train_model(model, train_loader, val_loader, criterion, optimizer, scheduler,
                device, num_epochs, scaler, phase_name="Phase 1"):
    """Full training loop with best model tracking."""
    best_acc = 0.0
    best_model_weights = copy.deepcopy(model.state_dict())
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    for epoch in range(num_epochs):
        print(f"\n  [{phase_name}] Epoch {epoch + 1}/{num_epochs}")

        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device, scaler)
        val_loss, val_acc = validate(model, val_loader, criterion, device)

        if scheduler:
            scheduler.step()

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)

        lr = optimizer.param_groups[0]["lr"]
        print(f"    Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f}")
        print(f"    Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.4f} | LR: {lr:.2e}")

        if val_acc > best_acc:
            best_acc = val_acc
            best_model_weights = copy.deepcopy(model.state_dict())
            print(f"    ✅ New best model (val_acc: {best_acc:.4f})")

    model.load_state_dict(best_model_weights)
    return model, history


# ========================
# Evaluation
# ========================
def evaluate_model(model, test_loader, class_names, device, output_dir):
    """Evaluate on test set, generate classification report and confusion matrix."""
    model.eval()
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for images, labels in tqdm(test_loader, desc="  Evaluating"):
            images = images.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.numpy())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    # Classification report
    report = classification_report(all_labels, all_preds, target_names=class_names)
    print("\n" + "=" * 50)
    print("CLASSIFICATION REPORT")
    print("=" * 50)
    print(report)

    with open(os.path.join(output_dir, "classification_report.txt"), "w") as f:
        f.write(report)

    # Confusion matrix
    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=class_names, yticklabels=class_names)
    plt.title("Confusion Matrix — Chest X-Ray")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "confusion_matrix.png"), dpi=150)
    plt.close()

    # Accuracy
    test_acc = (all_preds == all_labels).mean()
    print(f"\nTest Accuracy: {test_acc:.4f}")

    return test_acc


# ========================
# Plotting
# ========================
def plot_training_history(history_p1, history_p2, output_dir):
    """Plot combined training history for both phases."""
    acc = history_p1["train_acc"] + history_p2["train_acc"]
    val_acc = history_p1["val_acc"] + history_p2["val_acc"]
    loss = history_p1["train_loss"] + history_p2["train_loss"]
    val_loss = history_p1["val_loss"] + history_p2["val_loss"]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    ax1.plot(acc, label="Train Accuracy")
    ax1.plot(val_acc, label="Val Accuracy")
    ax1.axvline(x=len(history_p1["train_acc"]) - 1, color="r", linestyle="--", label="Fine-tuning Start")
    ax1.set_title("Model Accuracy")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Accuracy")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    ax2.plot(loss, label="Train Loss")
    ax2.plot(val_loss, label="Val Loss")
    ax2.axvline(x=len(history_p1["train_loss"]) - 1, color="r", linestyle="--", label="Fine-tuning Start")
    ax2.set_title("Model Loss")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Loss")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "training_history.png"), dpi=150)
    plt.close()
    print("Training history plot saved.")


# ========================
# ONNX Export
# ========================
def export_to_onnx(model, output_dir, class_names, device):
    """Export model to ONNX format for browser inference."""
    model.eval()
    model_for_export = model.to("cpu")

    # Wrap model to include softmax in output
    class ModelWithSoftmax(nn.Module):
        def __init__(self, base_model):
            super().__init__()
            self.base = base_model

        def forward(self, x):
            logits = self.base(x)
            return torch.softmax(logits, dim=1)

    export_model = ModelWithSoftmax(model_for_export)
    export_model.eval()

    # Dummy input
    dummy_input = torch.randn(1, 3, CONFIG["img_size"], CONFIG["img_size"])

    onnx_path = os.path.join(output_dir, "model.onnx")
    torch.onnx.export(
        export_model,
        dummy_input,
        onnx_path,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
        opset_version=17,
        do_constant_folding=True,
    )
    print(f"ONNX model exported to: {onnx_path}")

    # Save labels JSON
    labels = {
        "class_names": class_names,
        "model_type": "chest_xray",
        "architecture": "EfficientNet-B0",
        "input_size": CONFIG["img_size"],
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225],
        },
    }
    labels_path = os.path.join(output_dir, "labels.json")
    with open(labels_path, "w") as f:
        json.dump(labels, f, indent=2)
    print(f"Labels saved to: {labels_path}")

    # Move model back to original device
    model.to(device)
    return onnx_path


# ========================
# Main
# ========================
def main():
    print("=" * 60)
    print("  CHEST X-RAY PNEUMONIA DETECTION — PyTorch + CUDA")
    print("=" * 60)

    # Check dataset
    if not os.path.exists(CONFIG["dataset_dir"]):
        print(f"\n❌ Dataset not found at: {CONFIG['dataset_dir']}")
        print(f"\nPlease download the dataset from:")
        print(f"  https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia")
        print(f"\nAnd extract it to: {CONFIG['dataset_dir']}")
        return

    os.makedirs(CONFIG["output_dir"], exist_ok=True)

    # Device setup
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if device.type == "cuda":
        gpu_name = torch.cuda.get_device_name(0)
        gpu_mem = torch.cuda.get_device_properties(0).total_memory / 1024**3
        print(f"\n✅ GPU: {gpu_name} ({gpu_mem:.1f} GB VRAM)")
    else:
        print("\n⚠️  No GPU detected. Training on CPU (will be slower).")

    # Transforms
    train_transform, val_transform = get_transforms()

    # Load datasets
    print("\n📁 Loading dataset...")
    train_full = datasets.ImageFolder(
        os.path.join(CONFIG["dataset_dir"], "train"), transform=train_transform
    )

    # The Kaggle val set is tiny (16 images). Merge it and split properly.
    val_orig = datasets.ImageFolder(
        os.path.join(CONFIG["dataset_dir"], "val"), transform=train_transform
    )
    combined_train = ConcatDataset([train_full, val_orig])

    # Split 85% train / 15% val
    total_size = len(combined_train)
    val_size = int(0.15 * total_size)
    train_size = total_size - val_size
    train_dataset, val_dataset = random_split(
        combined_train, [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )

    # Apply val_transform to val_dataset (override augmentation)
    # We create a separate val dataset without augmentation
    val_clean = datasets.ImageFolder(
        os.path.join(CONFIG["dataset_dir"], "train"), transform=val_transform
    )
    val_orig_clean = datasets.ImageFolder(
        os.path.join(CONFIG["dataset_dir"], "val"), transform=val_transform
    )
    combined_val = ConcatDataset([val_clean, val_orig_clean])
    _, val_dataset_clean = random_split(
        combined_val, [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )

    test_dataset = datasets.ImageFolder(
        os.path.join(CONFIG["dataset_dir"], "test"), transform=val_transform
    )

    print(f"   Training samples:   {train_size}")
    print(f"   Validation samples: {val_size}")
    print(f"   Test samples:       {len(test_dataset)}")
    print(f"   Classes:            {train_full.class_to_idx}")

    # Class weights for imbalanced data
    all_labels = [label for _, label in train_full.samples]
    class_counts = np.bincount(all_labels)
    total = len(all_labels)
    class_weights = torch.tensor(
        [total / (len(class_counts) * c) for c in class_counts],
        dtype=torch.float32
    ).to(device)
    print(f"   Class weights:      {class_weights.cpu().numpy()}")

    # Data loaders
    train_loader = DataLoader(
        train_dataset, batch_size=CONFIG["batch_size"],
        shuffle=True, num_workers=CONFIG["num_workers"], pin_memory=True,
    )
    val_loader = DataLoader(
        val_dataset_clean, batch_size=CONFIG["batch_size"],
        shuffle=False, num_workers=CONFIG["num_workers"], pin_memory=True,
    )
    test_loader = DataLoader(
        test_dataset, batch_size=CONFIG["batch_size"],
        shuffle=False, num_workers=CONFIG["num_workers"], pin_memory=True,
    )

    # Build model
    print("\n🏗️  Building EfficientNet-B0 model...")
    model = ChestXRayClassifier(num_classes=2).to(device)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"   Total parameters:     {total_params:,}")
    print(f"   Trainable parameters: {trainable:,}")

    # Loss with label smoothing
    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=CONFIG["label_smoothing"])
    scaler = torch.amp.GradScaler(enabled=(device.type == "cuda"))

    # ===== Phase 1: Train classification head (backbone frozen) =====
    print("\n🚀 Phase 1: Training classification head (backbone frozen)...")
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=CONFIG["learning_rate"], weight_decay=0.01,
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=CONFIG["epochs"], eta_min=1e-6)

    start_time = time.time()
    model, history_p1 = train_model(
        model, train_loader, val_loader, criterion, optimizer, scheduler,
        device, CONFIG["epochs"], scaler, phase_name="Head"
    )
    p1_time = time.time() - start_time
    print(f"\n   Phase 1 completed in {p1_time / 60:.1f} minutes")

    # ===== Phase 2: Fine-tune backbone =====
    print(f"\n🔧 Phase 2: Fine-tuning backbone...")
    model.unfreeze_backbone(num_blocks=3)

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"   Trainable parameters: {trainable:,}")

    # Rebuild criterion (class weights may need refresh)
    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=CONFIG["label_smoothing"])
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=CONFIG["fine_tune_lr"], weight_decay=0.01,
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=CONFIG["fine_tune_epochs"], eta_min=1e-7
    )

    start_time = time.time()
    model, history_p2 = train_model(
        model, train_loader, val_loader, criterion, optimizer, scheduler,
        device, CONFIG["fine_tune_epochs"], scaler, phase_name="Fine-tune"
    )
    p2_time = time.time() - start_time
    print(f"\n   Phase 2 completed in {p2_time / 60:.1f} minutes")

    # Evaluate
    print("\n📊 Evaluating on test set...")
    test_acc = evaluate_model(model, test_loader, CONFIG["class_names"], device, CONFIG["output_dir"])

    # Save PyTorch model
    model_path = os.path.join(CONFIG["output_dir"], "model.pth")
    torch.save(model.state_dict(), model_path)
    print(f"\n💾 PyTorch model saved to: {model_path}")

    # Plot
    plot_training_history(history_p1, history_p2, CONFIG["output_dir"])

    # Export to ONNX
    print("\n📦 Exporting to ONNX...")
    onnx_path = export_to_onnx(model, CONFIG["output_dir"], CONFIG["class_names"], device)

    # Summary
    total_time = (p1_time + p2_time) / 60
    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE!")
    print("=" * 60)
    print(f"  Device:         {device} ({torch.cuda.get_device_name(0) if device.type == 'cuda' else 'CPU'})")
    print(f"  Test Accuracy:  {test_acc:.4f}")
    print(f"  Total Time:     {total_time:.1f} minutes")
    print(f"  PyTorch Model:  {model_path}")
    print(f"  ONNX Model:     {onnx_path}")
    print(f"  Classes:        {CONFIG['class_names']}")
    print("=" * 60)
    print(f"\n  Copy model.onnx + labels.json to: public/models/chest-xray/")


if __name__ == "__main__":
    main()
