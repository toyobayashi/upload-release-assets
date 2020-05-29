``` yml
name: Test

on: push

jobs:
  draft:
    name: Draft
    runs-on: ubuntu-latest
    outputs:
      upload_url: ${{ steps.create_release.outputs.upload_url }}
    steps:
    - name: Create Release Draft
      # if: ${{ startsWith(github.event.ref, 'refs/tags') }}
      id: create_release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: ${{ github.ref }}
        draft: true
        prerelease: false

  build:
    name: Build
    needs: draft
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [windows-latest, ubuntu-latest, macos-latest]

    steps:
    - name: Show GITHUB_WORKSPACE
      run: echo $GITHUB_WORKSPACE

    - uses: actions/checkout@v2

    - name: Windows build
      if: ${{ matrix.os == 'windows-latest' }}
      shell: cmd
      run: |
        mkdir .\out
        echo "win32">.\out\win32.txt

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
        echo "linux" > ./out/linux.txt
    
    - name: Test upload
      # if: ${{ startsWith(github.event.ref, 'refs/tags') }}
      uses: toyobayashi/upload-release-assets@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ needs.draft.outputs.upload_url }} 
        assets: ./out/*.txt; ./dist/main.js; ./not/exists
```
