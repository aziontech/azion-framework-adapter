**What is the purpose of this Pull Request?**

_Implement error handling if build files do not exist_

**What was done to achieve this purpose?**

_Vefify the return of the class ManifestBuilder and return a error if the result is empty_

**How to test if this really works?**

_Delete the content of ./out directory manualy e run the command azioncli publish again_

**Is closing some issue?**

_No._

**Who can help review this Merge Request?**

@MagnunAVF

keywords: `fix, close, resolve`

**TODO**

_If you have something that still needs to be done create a list here_

- [ ] _create a standard output message for the user._