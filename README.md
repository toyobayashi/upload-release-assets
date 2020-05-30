``` yml
name: Build

on: [push, pull_request]

jobs:
  build:
    name: Build
    needs: draft
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [windows-latest, ubuntu-latest, macos-latest]

    steps:
    - uses: actions/checkout@v2

    - name: Windows build
      if: ${{ matrix.os == 'windows-latest' }}
      shell: cmd
      run: |
        mkdir .\out
        echo win32>.\out\win32.txt

    - name: Linux build
      if: ${{ matrix.os == 'ubuntu-latest' }}
      shell: bash
      run: |
        mkdir -p ./out
        echo "linux" > ./out/linux.txt

    - name: macOS build
      if: ${{ matrix.os == 'macos-latest' }}
      shell: bash
      run: |
        mkdir -p ./out
        echo "darwin" > ./out/darwin.txt
    
    - name: Test upload
      if: ${{ startsWith(github.event.ref, 'refs/tags') }}
      uses: toyobayashi/upload-release-assets@v2.1.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.event.after }} # required
        release_name: ${{ github.event.after }} # required
        # target_commitish: ''
        # body: ''
        draft: true
        prerelease: false
        assets: |
          ./out/*.txt
          ./dist/main.js
          ./not/exists
```
