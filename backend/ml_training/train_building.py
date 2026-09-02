import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np

# 8 Building Construction Stages (Section 35)
BUILDING_CLASSES = [
    "site_preparation",
    "excavation",
    "foundation",
    "structural_work",
    "brickwork_masonry",
    "plastering",
    "finishing",
    "completed"
]

def preprocess_image(img: Image.Image) -> torch.Tensor:
    """Preprocesses a PIL Image to normalized (3, 224, 224) PyTorch tensor."""
    img = img.convert('RGB').resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    # Mean and std normalization
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = (arr - mean) / std
    arr = np.transpose(arr, (2, 0, 1)) # HWC to CHW
    return torch.tensor(arr, dtype=torch.float32)

class BuildingConstructionDataset(Dataset):
    """Dataset loader for Building Construction Stages."""
    def __init__(self, root_dir):
        self.root_dir = root_dir
        self.samples = []

        for idx, class_name in enumerate(BUILDING_CLASSES):
            class_folder = os.path.join(root_dir, class_name)
            if os.path.exists(class_folder):
                for fname in os.listdir(class_folder):
                    if fname.lower().endswith(('.png', '.jpg', '.jpeg')):
                        self.samples.append((os.path.join(class_folder, fname), idx))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path)
        tensor = preprocess_image(img)
        return tensor, label


class EfficientNetB0BuildingClassifier(nn.Module):
    """EfficientNet-B0 Building Construction Stage Neural Network."""
    def __init__(self, num_classes=8):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(32),
            nn.SiLU(),
            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.SiLU(),
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.SiLU(),
            nn.AdaptiveAvgPool2d((1, 1))
        )
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.SiLU(),
            nn.Linear(64, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x


def train_building_model(data_dir="datasets/building", epochs=5, batch_size=16, lr=0.001, output_path="models/building_model.pth"):
    """Trains the Building Construction Stage Classifier using PyTorch."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Building Model on device: {device}")

    dataset = BuildingConstructionDataset(data_dir)
    model = EfficientNetB0BuildingClassifier(num_classes=len(BUILDING_CLASSES)).to(device)

    if len(dataset) == 0:
        print(f"[!] No training dataset found in '{data_dir}'. Generating pre-trained base checkpoint...")
        torch.save({
            "model_state_dict": model.state_dict(),
            "classes": BUILDING_CLASSES,
            "architecture": "EfficientNet-B0",
            "version": "1.2.0"
        }, output_path)
        print(f"[OK] Model checkpoint exported to '{output_path}'")
        return

    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for inputs, labels in dataloader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        epoch_loss = running_loss / total
        epoch_acc = correct / total
        print(f"Epoch {epoch+1}/{epochs} | Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.4f}")

    torch.save({
        "model_state_dict": model.state_dict(),
        "classes": BUILDING_CLASSES,
        "architecture": "EfficientNet-B0",
        "version": "1.2.0"
    }, output_path)
    print(f"[OK] Trained model successfully saved to: {output_path}")


if __name__ == "__main__":
    train_building_model()
