"""
==============================================
  Skin Lesion Classification — PyTorch
==============================================
Dataset: HAM10000 from Kaggle
URL: https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000

Classes (7):
  - akiec: Actinic Keratoses
  - bcc:   Basal Cell Carcinoma
  - bkl:   Benign Keratosis
  - df:    Dermatofibroma
  - mel:   Melanoma
  - nv:    Melanocytic Nevi
  - vasc:  Vascular Lesions

Architecture: EfficientNet-B0 + Custom Head (Transfer Learning)
Output: ONNX model for browser inference via ONNX Runtime Web

Instructions:
  1. Download HAM10000 from Kaggle:
     https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000
  2. Extract to: model_training/datasets/skin_lesion/
     Expected files:
       datasets/skin_lesion/
         HAM10000_images_part_1/    (folder with .jpg images)
         HAM10000_images_part_2/    (folder with .jpg images)
         HAM10000_metadata.csv      (CSV with labels)
  3. pip install -r requirements.txt
  4. Run: python train_skin_lesion.py
"""

import os
import sys
import time
import json
import copy
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import shutil

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from tqdm import tqdm

# ========================
# Configuration
# ========================
CONFIG = {
    "dataset_dir": os.path.join(os.path.dirname(__file__), "datasets", "skin_lesion"),
    "output_dir": os.path.join(os.path.dirname(__file__), "saved_models", "skin_lesion"),
    "processed_dir": os.path.join(os.path.dirname(__file__), "datasets", "skin_lesion_processed"),
    "img_size": 224,
    "batch_size": 32,
    "epochs": 30,
    "learning_rate": 1e-3,
    "fine_tune_epochs": 15,
    "fine_tune_lr": 1e-4,
    "label_smoothing": 0.1,
    "num_workers": 4,
    "class_names": [
        "Actinic Keratoses",
        "Basal Cell Carcinoma",
        "Benign Keratosis",
        "Dermatofibroma",
        "Melanoma",
        "Melanocytic Nevi",
        "Vascular Lesions",
    ],
    "class_codes": ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"],
}


# ========================
# Dataset Preparation
# ========================
def prepare_dataset(dataset_dir, processed_dir):
    """
    Read HAM10000 metadata and organize images into train/val/test folders
    structured by class for ImageFolder.
    """
    print("📦 Preparing dataset from HAM10000...")

    # Check if already processed
    if os.path.exists(os.path.join(processed_dir, "train")):
        print("   Dataset already processed. Using existing split.")
        return

    metadata_path = os.path.join(dataset_dir, "HAM10000_metadata.csv")
    if not os.path.exists(metadata_path):
        raise FileNotFoundError(
            f"Metadata file not found: {metadata_path}\n"
            "Please download HAM10000 from Kaggle and extract to the dataset directory."
        )

    df = pd.read_csv(metadata_path)
    print(f"   Total images in metadata: {len(df)}")
    print(f"   Class distribution:\n{df['dx'].value_counts()}\n")

    # Find all image directories
    image_dirs = []
    for name in os.listdir(dataset_dir):
        path = os.path.join(dataset_dir, name)
        if os.path.isdir(path) and "images" in name.lower():
            image_dirs.append(path)

    if not image_dirs:
        if any(f.endswith(".jpg") for f in os.listdir(dataset_dir)):
            image_dirs = [dataset_dir]

    print(f"   Image directories: {image_dirs}")

    # Build image path lookup
    image_paths = {}
    for img_dir in image_dirs:
        for fname in os.listdir(img_dir):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                image_id = os.path.splitext(fname)[0]
                image_paths[image_id] = os.path.join(img_dir, fname)

    print(f"   Found {len(image_paths)} images on disk")

    # Filter metadata
    df = df[df["image_id"].isin(image_paths)]
    df["path"] = df["image_id"].map(image_paths)
    print(f"   Matched images: {len(df)}")

    # Split: 70% train, 15% val, 15% test (stratified)
    train_df, temp_df = train_test_split(df, test_size=0.3, stratify=df["dx"], random_state=42)
    val_df, test_df = train_test_split(temp_df, test_size=0.5, stratify=temp_df["dx"], random_state=42)

    print(f"   Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")

    # Copy files into folder structure
    for split, split_df in [("train", train_df), ("val", val_df), ("test", test_df)]:
        for class_code in CONFIG["class_codes"]:
            os.makedirs(os.path.join(processed_dir, split, class_code), exist_ok=True)

        for _, row in tqdm(split_df.iterrows(), total=len(split_df), desc=f"  Copying {split}"):
            src = row["path"]
            dst = os.path.join(processed_dir, split, row["dx"], f"{row['image_id']}.jpg")
            if not os.path.exists(dst):
                shutil.copy2(src, dst)

    print("   ✅ Dataset organized into train/val/test folders")


# ========================
# Data Augmentation
# ========================
def get_transforms():
    """Transforms with skin-lesion-specific augmentation."""
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    train_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomResizedCrop(CONFIG["img_size"], scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(30),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), shear=15),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
        transforms.RandomErasing(p=0.3, scale=(0.02, 0.2)),
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
class SkinLesionClassifier(nn.Module):
    """EfficientNet-B0 based classifier for skin lesion (7 classes)."""

    def __init__(self, num_classes=7):
        super().__init__()
        self.backbone = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)

        for param in self.backbone.features.parameters():
            param.requires_grad = False

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
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        return self.backbone(x)

    def unfreeze_backbone(self, num_blocks=4):
        """Unfreeze the last N MBConv blocks. Skin lesion benefits from more fine-tuning."""
        blocks = list(self.backbone.features.children())
        for block in blocks[-num_blocks:]:
            for param in block.parameters():
                param.requires_grad = True
        print(f"   Unfroze last {num_blocks} backbone blocks for fine-tuning")


# ========================
# Training
# ========================
def train_one_epoch(model, dataloader, criterion, optimizer, device, scaler):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    pbar = tqdm(dataloader, desc="  Training", leave=False)
    for images, labels in pbar:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        with torch.amp.autocast(device_type="cuda", enabled=(device.type == "cuda")):
            outputs = model(images)
            loss = criterion(outputs, labels)

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
def evaluate_model(model, test_loader, class_names, class_codes, device, output_dir):
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

    report = classification_report(all_labels, all_preds, target_names=class_codes)
    print("\n" + "=" * 50)
    print("CLASSIFICATION REPORT")
    print("=" * 50)
    print(report)

    with open(os.path.join(output_dir, "classification_report.txt"), "w") as f:
        f.write(report)

    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=class_codes, yticklabels=class_codes)
    plt.title("Confusion Matrix — Skin Lesion Classification")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "confusion_matrix.png"), dpi=150)
    plt.close()

    test_acc = (all_preds == all_labels).mean()
    print(f"\nTest Accuracy: {test_acc:.4f}")
    return test_acc


# ========================
# Plotting
# ========================
def plot_training_history(history_p1, history_p2, output_dir):
    acc = history_p1["train_acc"] + history_p2["train_acc"]
    val_acc = history_p1["val_acc"] + history_p2["val_acc"]
    loss = history_p1["train_loss"] + history_p2["train_loss"]
    val_loss = history_p1["val_loss"] + history_p2["val_loss"]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    ax1.plot(acc, label="Train Accuracy")
    ax1.plot(val_acc, label="Val Accuracy")
    ax1.axvline(x=len(history_p1["train_acc"]) - 1, color="r", linestyle="--", label="Fine-tuning")
    ax1.set_title("Skin Lesion Model — Accuracy")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Accuracy")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    ax2.plot(loss, label="Train Loss")
    ax2.plot(val_loss, label="Val Loss")
    ax2.axvline(x=len(history_p1["train_loss"]) - 1, color="r", linestyle="--", label="Fine-tuning")
    ax2.set_title("Skin Lesion Model — Loss")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Loss")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "training_history.png"), dpi=150)
    plt.close()


# ========================
# ONNX Export
# ========================
def export_to_onnx(model, output_dir, class_names, class_codes, device):
    model.eval()
    model_cpu = model.to("cpu")

    class ModelWithSoftmax(nn.Module):
        def __init__(self, base_model):
            super().__init__()
            self.base = base_model

        def forward(self, x):
            logits = self.base(x)
            return torch.softmax(logits, dim=1)

    export_model = ModelWithSoftmax(model_cpu)
    export_model.eval()

    dummy_input = torch.randn(1, 3, CONFIG["img_size"], CONFIG["img_size"])

    onnx_path = os.path.join(output_dir, "model.onnx")
    torch.onnx.export(
        export_model, dummy_input, onnx_path,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
        opset_version=17,
        do_constant_folding=True,
    )
    print(f"ONNX model exported to: {onnx_path}")

    labels = {
        "class_names": class_names,
        "class_codes": class_codes,
        "model_type": "skin_lesion",
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

    model.to(device)
    return onnx_path


# ========================
# Main
# ========================
def main():
    print("=" * 60)
    print("  SKIN LESION CLASSIFICATION — PyTorch + CUDA")
    print("=" * 60)

    if not os.path.exists(CONFIG["dataset_dir"]):
        print(f"\n❌ Dataset not found at: {CONFIG['dataset_dir']}")
        print(f"\nDownload HAM10000 from Kaggle:")
        print(f"  https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000")
        print(f"\nExtract to: {CONFIG['dataset_dir']}")
        return

    os.makedirs(CONFIG["output_dir"], exist_ok=True)

    # Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if device.type == "cuda":
        gpu_name = torch.cuda.get_device_name(0)
        gpu_mem = torch.cuda.get_device_properties(0).total_memory / 1024**3
        print(f"\n✅ GPU: {gpu_name} ({gpu_mem:.1f} GB VRAM)")
    else:
        print("\n⚠️  No GPU detected. Training on CPU.")

    # Prepare dataset
    prepare_dataset(CONFIG["dataset_dir"], CONFIG["processed_dir"])

    # Transforms
    train_transform, val_transform = get_transforms()

    # Load datasets
    print("\n📁 Creating data loaders...")
    train_dataset = datasets.ImageFolder(
        os.path.join(CONFIG["processed_dir"], "train"), transform=train_transform
    )
    val_dataset = datasets.ImageFolder(
        os.path.join(CONFIG["processed_dir"], "val"), transform=val_transform
    )
    test_dataset = datasets.ImageFolder(
        os.path.join(CONFIG["processed_dir"], "test"), transform=val_transform
    )

    class_names_from_folder = train_dataset.classes
    num_classes = len(class_names_from_folder)
    print(f"   Classes: {class_names_from_folder}")
    print(f"   Train: {len(train_dataset)}, Val: {len(val_dataset)}, Test: {len(test_dataset)}")

    # Class weights (HAM10000 is highly imbalanced — nv dominates)
    all_labels = [label for _, label in train_dataset.samples]
    class_counts = np.bincount(all_labels, minlength=num_classes)
    total_samples = len(all_labels)
    class_weights = torch.tensor(
        [total_samples / (num_classes * c) if c > 0 else 1.0 for c in class_counts],
        dtype=torch.float32
    ).to(device)
    print(f"   Class distribution: {dict(zip(class_names_from_folder, class_counts.tolist()))}")
    print(f"   Class weights:      {class_weights.cpu().numpy().round(3)}")

    # Loaders
    train_loader = DataLoader(train_dataset, batch_size=CONFIG["batch_size"],
                              shuffle=True, num_workers=CONFIG["num_workers"], pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=CONFIG["batch_size"],
                            shuffle=False, num_workers=CONFIG["num_workers"], pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=CONFIG["batch_size"],
                             shuffle=False, num_workers=CONFIG["num_workers"], pin_memory=True)

    # Model
    print(f"\n🏗️  Building EfficientNet-B0 model ({num_classes} classes)...")
    model = SkinLesionClassifier(num_classes=num_classes).to(device)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"   Total parameters:     {total_params:,}")
    print(f"   Trainable parameters: {trainable:,}")

    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=CONFIG["label_smoothing"])
    scaler = torch.amp.GradScaler(enabled=(device.type == "cuda"))

    # Phase 1
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

    # Phase 2
    print(f"\n🔧 Phase 2: Fine-tuning backbone...")
    model.unfreeze_backbone(num_blocks=4)  # More blocks for skin (7-class is harder)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"   Trainable parameters: {trainable:,}")

    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=CONFIG["label_smoothing"])
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=CONFIG["fine_tune_lr"], weight_decay=0.01,
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=CONFIG["fine_tune_epochs"], eta_min=1e-7)

    start_time = time.time()
    model, history_p2 = train_model(
        model, train_loader, val_loader, criterion, optimizer, scheduler,
        device, CONFIG["fine_tune_epochs"], scaler, phase_name="Fine-tune"
    )
    p2_time = time.time() - start_time
    print(f"\n   Phase 2 completed in {p2_time / 60:.1f} minutes")

    # Evaluate
    print("\n📊 Evaluating on test set...")
    # Map folder codes to display names
    code_to_name = dict(zip(CONFIG["class_codes"], CONFIG["class_names"]))
    display_names = [code_to_name.get(c, c) for c in class_names_from_folder]

    test_acc = evaluate_model(
        model, test_loader, display_names, class_names_from_folder,
        device, CONFIG["output_dir"]
    )

    # Save
    model_path = os.path.join(CONFIG["output_dir"], "model.pth")
    torch.save(model.state_dict(), model_path)
    print(f"\n💾 PyTorch model saved to: {model_path}")

    plot_training_history(history_p1, history_p2, CONFIG["output_dir"])

    # ONNX Export
    print("\n📦 Exporting to ONNX...")
    onnx_path = export_to_onnx(
        model, CONFIG["output_dir"], display_names, class_names_from_folder, device
    )

    total_time = (p1_time + p2_time) / 60
    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE!")
    print("=" * 60)
    print(f"  Device:         {device} ({torch.cuda.get_device_name(0) if device.type == 'cuda' else 'CPU'})")
    print(f"  Test Accuracy:  {test_acc:.4f}")
    print(f"  Total Time:     {total_time:.1f} minutes")
    print(f"  ONNX Model:     {onnx_path}")
    print(f"  Classes:        {display_names}")
    print("=" * 60)
    print(f"\n  Copy model.onnx + labels.json to: public/models/skin-lesion/")


if __name__ == "__main__":
    main()
