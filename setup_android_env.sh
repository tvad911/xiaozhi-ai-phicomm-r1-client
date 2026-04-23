#!/bin/bash
set -e

echo "Bắt đầu cài đặt môi trường build Android (Không cần root)..."

echo "[1/4] Cài đặt SDKMAN và Java 17..."
if [ ! -d "$HOME/.sdkman" ]; then
    curl -s "https://get.sdkman.io" | bash
fi

# Nạp SDKMAN vào shell hiện tại
export SDKMAN_DIR="$HOME/.sdkman"
[[ -s "$HOME/.sdkman/bin/sdkman-init.sh" ]] && source "$HOME/.sdkman/bin/sdkman-init.sh"

echo "Cài đặt Java 17 (Temurin) và Gradle..."
sdk install java 17.0.10-tem || true
sdk install gradle 8.5 || true

echo "[2/4] Tải và cài đặt Android Command Line Tools..."
mkdir -p $HOME/.android/sdk/cmdline-tools
cd $HOME/.android/sdk/cmdline-tools

if [ ! -d "latest" ]; then
    echo "Đang tải Android Command Line Tools..."
    wget -q --show-progress https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
    unzip -q commandlinetools-linux-*_latest.zip
    mv cmdline-tools latest
    rm commandlinetools-linux-*_latest.zip
fi

echo "[3/4] Cấu hình biến môi trường và tải Android SDK..."
export ANDROID_HOME=$HOME/.android/sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

echo "Chấp nhận điều khoản SDK..."
yes | sdkmanager --licenses > /dev/null 2>&1 || true

echo "Tải platform, build-tools, cmake và ndk..."
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "cmake;3.22.1" "ndk;25.1.8937393"

echo "[4/4] Hoàn tất cài đặt!"
echo "================================================================="
echo "ĐỂ THỰC HIỆN BUILD, HÃY COPY VÀ DÁN CÁC LỆNH SAU VÀO TERMINAL CỦA BẠN:"
echo "================================================================="
echo ""
echo 'export ANDROID_HOME=$HOME/.android/sdk'
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools'
echo 'source "$HOME/.sdkman/bin/sdkman-init.sh"'
echo 'cd /home/anhduong/docker/rust/xiaozhi-ai-phicomm-r1/android-project'
echo 'gradle wrapper'
echo './gradlew assembleDebug'
echo ""
