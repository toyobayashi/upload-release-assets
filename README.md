# upload-release-assets

A GitHub Action of creating release and uploading release assets.

## Feature

* Auto create release if release tag does not exist

* Support multiple paths or globs

* Upload assets to the same release if your job runs in different runner

* Use Node.js stream instead of reading whole file to memory

## Usage

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
    
    - name: Create release
      if: ${{ startsWith(github.event.ref, 'refs/tags') }}
      uses: toyobayashi/upload-release-assets@v3.0.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.event.after }} # required, create if the tag does not exist
        release_name: ${{ github.event.after }} # required
        # target_commitish: ''
        # body: ''
        draft: true
        prerelease: false

        # The value of `assets` field can be a single line string that includes
        # paths or globs seperated by `;`

        # assets: ./out/*.txt; ./dist/main.js; ./not/exists

        # It can be also multiple line
        assets: |
          ./out/*.txt
          ./dist/main.js
          ./not/exists
```
