import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DebtorsApiService } from '../../services/debtors-api.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientsDebtorsService } from '../../services/clients-debtors.service';
import { error, event } from 'jquery';
import { count, map } from 'rxjs/operators';
import { RoundThousandsPipe } from '../../round-thousands.pipe';
import { LoginService } from '../../services/login.service';
import { AddressAutocompleteService } from '../../services/address-autocomplete.service';
// import imageCompression from 'browser-image-compression';
declare var pca: any;

interface Response {
  payments: Array<any>;
}

@Component({
  selector: 'app-document-dialog',
  templateUrl: './document-dialog.component.html',
  styleUrl: './document-dialog.component.css',  
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDialogComponent implements OnInit {
  link: any;
  documentDescr: any;
  documentCategory: any;
  documentFolder: any;
  file!: File;
  path: any;
  ContactName: any;
  ContactEmail: any;
  ContactNo: any;  
  debtor: any;

  contactColumns: string[] = ['name', 'email', 'contact_no'];
  paymentsColumns: string[] = ['CheckNo', 'ClientName', 'DebtorName', 'PostDate', 'Buy', 'PayAmt'];
  auditColumns: string[] = ['TimeStamp', 'UserKey', 'Field', 'Was', 'Is'];
  statementsColumns: string[] = ['Debtor', 'Client', 'PO/LOAD', 'Invoice#', 'InvDate', 'Age', 'Currency', 'Amt', 'Balance'];
  paymentColumns: string[] = ['date', 'check#', 'amount'];
  miscDataColumns: string[] = ['element', 'value'];
  contactDataSource = new MatTableDataSource<any>([]);
  auditDataSource = new MatTableDataSource<any>([]);
  statementsDataSource = new MatTableDataSource<any>([]);
  paymentDataSource = new MatTableDataSource<any>([]);
  MiscDataListDataSource = new MatTableDataSource<any>([]);
  ratesDataSource = new MatTableDataSource<any>([]);
  paymentsDataSource = new MatTableDataSource<any>([]);

  jpgDataUrl: string | ArrayBuffer | null = null;

  noaStatus = [
    { value: 'Not Sent', label: 'Not Sent' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Received', label: 'Received' }
  ]

  editForm!: FormGroup;
  chequeSearchForm!: FormGroup;
  changedNoaStatus!: string;    
  payment_images!: { fullname: string; basename: any; }[];
  fileExtension: any;
  addressSuggestions: any[] = [];
  selectedValue!: string;
  
  constructor(private fb: FormBuilder,private http: HttpClient,private clientService: ClientsDebtorsService, private loginService: LoginService, private dataService: DebtorsApiService,private dialogRef: MatDialogRef<DocumentDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private addressCompleteService: AddressAutocompleteService) {
    if(data.openChequeSearchForm){  
      this.chequeSearchForm = this.fb.group({
        CheckNo: [''],
        Amt: [''],
        PostDateStart: [''],
        PostDateEnd: [''],
        LastPayments: ['']
      });
      this.onChequeSearch();
    } else if(data.openForm){      

    if(data.Phone1.length == 11 || data.Phone2.length == 11){
      var Phone1 = data.Phone1.substring(1);
      var Phone2 = data.Phone2.substring(1);
    } else {
      Phone1 = data.Phone1;
      Phone2 = data.Phone2;
    }

    const roundThousandsPipe = new RoundThousandsPipe();
    var creditLimit = roundThousandsPipe.transform(data.TotalCreditLimit);
    
    this.editForm = this.fb.group({
      DebtorKey: [data.DebtorKey || ''],
      Debtor: [data.Debtor || ''],
      Duns: [data.Duns || ''],
      Addr1: [data.Addr1 || ''],
      Addr2: [data.Addr2 || ''],
      City: [data.City || ''],
      State: [data.State || ''],      
      Phone1: [Phone1 || ''],
      Phone2: [Phone2 || ''],
      TotalCreditLimit: [creditLimit || ''],
      AIGLimit: [data.AIGLimit || ''],
      Terms: [data.Terms || ''],
      Email: [data.Email || ''],
      MotorCarrNo: [data.MotorCarrNo || ''],
      CredExpireMos: [ data.CredExpireMos || ''],
      RateDate: [data.RateDate || ''],
      Notes: [data.Notes || ''],
      CredNote: [data.CredNote || ''],
      IndivCreditLimit: [data.IndivCreditLimit || ''],
      CredAppBy: [data.CredAppBy || ''],
      FFNo: [data.FFNo || ''],
      CVOR: [data.Cvor || ''],
      USDOT: [data.USDot || ''],
      Warning: [data.Warning || ''],      
      DotNo: [data.DotNo || '']      
    })

      this.debtor = data.Debtor
    } else if (data.documentsList) {
      this.data.documentsList.forEach((document: { FileName: string; Path: any; DocHdrKey: { toString: () => string; }; Link: string; }, index: any) => {
        const filename = document.FileName.split('.');
        const x = filename.length - 1;
        const link = `${document.Path}\\${document.DocHdrKey.toString().padStart(6, '0')}.${filename[x]}`;
        document.Link = btoa(link);
        this.link = document.Link
      }); 
     
      this.data.documentsFolder.forEach((docFolder: any) => {
        this.path = docFolder.Path
      });
    } else if(data.DebtorPaymentsData) {
      this.clientService.getDebtorsPayments(data.DebtorKey, data.ClientKey).subscribe(response => {                                
        this.paymentDataSource.data = response.debtorPaymentsData;      
      });
    } else if(data.MiscDataList) {
      this.clientService.getMiscData(data.DebtorKey, data.ClientKey).subscribe(response => {                                
        this.MiscDataListDataSource.data = response.MiscDataList;      
      });
    } else if (data.exchangeRatesByMonth) {
      this.loginService.getExchangeRatesByMonth().subscribe(response => {                                
        this.ratesDataSource.data = response.exchangeRatesByMonth;
      });    
    } else if (data.debtorAudit) {            
      this.dataService.getDebtorsContacts(data.DebtorKey).subscribe(response => {                                
        this.auditDataSource.data = response.debtorAudit;        
      });                        
    } else if (data.debtorStatements) {            
      this.dataService.getDebtorsContacts(data.DebtorKey).subscribe(response => {                                
        this.statementsDataSource.data = response.debtorStatementsDetails;        
      });      
    } else if (data.chequeSearch) {                     
       
    } else {
      this.dataService.getDebtorsContacts(data.DebtorKey).subscribe(response => {                                
        this.contactDataSource.data = response.debtorContactsData;
      });
    }
  }

  ngOnInit(): void {
    const script = document.createElement('script');
    script.src = 'https://ws1.postescanada-canadapost.ca/js/addresscomplete-2.50.min.js';
    script.onload = () => {      
      const ac = new (<any>window).pca.AddressComplete(document.getElementById('Addr2'), {
        key: 'dy85-mj85-wx29-nn39',
        country: 'CAN'
      });
    };
    console.log(script);
    document.body.appendChild(script);
  }

  ngAfterViewInit() {
    // if (typeof pca !== 'undefined') {
    //   pca.setup({
    //     key: 'dy85-mj85-wx29-nn39',
    //     culture: 'en-CA'
    //   });
    // } else {
    //   console.error('AddressComplete script not loaded');
    // }
  }

  onAddressInput(event: any) {
    const query = event.target.value;
    this.addressCompleteService.getSuggestions(query).then((data: any) => {
      this.addressSuggestions = data;
    });
  }

  openFile(){
    // let url = atob(this.link);       
    // window.open("https://everest.revinc.com:4202/storage/uploads/");
    let url = 'https://login.baron.finance/iris/public/common/show_pdf.php?pdf=' + this.link;
    window.open(url);
    return false;
  }

  onFilechange(event: any) {    
    this.file = event.target.files[0]
  }
 
    
  onSubmit() { 
    const DebtorKey = this.data.DebtorKey;
    const Descr = this.documentDescr;
    const DocCatKey = this.documentCategory;
    const DocFolderPath = this.path;
    const file = this.file;
    
    const formData = new FormData();
    formData.append('DebtorKey', DebtorKey);
    formData.append('Descr', Descr);
    formData.append('DocCatKey', DocCatKey);
    formData.append('DocFolderPath', DocFolderPath);
    formData.append('file', this.file);
    
    this.http.post('https://everest.revinc.com:4202/api/debtorMasterAddDocument', formData)
     .subscribe(response => {
       console.log('file uploaded',response);       
     }, error => {
       console.error('Upload failed', error);
     });
    }

    onEdit(){
      if (this.editForm.valid) {  
        console.log(this.editForm.value);
        this.http.post(`https://everest.revinc.com:4202/api/updateDebtorDetails`, this.editForm.value)
        .subscribe(response => {
          console.log('Debtor data updated',response);       
          window.location.reload();
        }, error => {
          console.error('Error', error);
        });
      }
    }

    onChange(event: Event) {
      const selectElement = event.target as HTMLSelectElement;
        this.changedNoaStatus = selectElement.value
    }

    getPaymentsImage(event: any){        
      this.clientService.convertDebtorsPaymentsImages(event.PmtChecksKey).subscribe(response => {                                             
        console.log('file called',response);       
        }, error => {
          console.error('file failed', error);                             
        }
      );               
      this.clientService.startTimer(() => { 
        this.clientService.getDebtorsPaymentsImages(event.PmtChecksKey).subscribe(response => {                                                    
          response.debtorPaymentImages.forEach(async (element: any) => {   
            const fileName = element.FileName;
            this.fileExtension = this.getFileExtension(fileName);
            console.log(this.fileExtension);

            if (this.fileExtension == 'jpg' || this.fileExtension == 'jpeg' || this.fileExtension == 'png' || this.fileExtension == 'pdf'){
              window.open(`https://everest.revinc.com:4202/api/paymentsFiles/` + element.FileName);
            } else {
              window.open(`https://everest.revinc.com:4202/api/paymentsFiles/` + element.FileName + '.jpg');                       
            }
            
            });                                  
          }, error => {
            console.error('file not converted', error);                             
          }
        );  
      }, 3000);     
                              
    };  

    onRadioChange(value: string) {
      this.selectedValue = value;
    }

    onChequeSearch(){      
      if (this.chequeSearchForm.valid) {  
        let DebtorKey = this.data.DebtorKey;
        let CheckNo = this.chequeSearchForm.value.CheckNo;
        let Amt = this.chequeSearchForm.value.Amt;
        let PostDateStart = this.chequeSearchForm.value.PostDateStart;
        let PostDateEnd = this.chequeSearchForm.value.PostDateEnd;
        let LastPayments = '';
        // if (this.chequeSearchForm.value.LastPayments == true) {
          LastPayments = 'Y';
        // } else {
        //   LastPayments = 'N'
        // }

        this.dataService.getDebtorsPayments(DebtorKey, CheckNo, Amt, PostDateStart, PostDateEnd, LastPayments).subscribe(response => {                                
          this.paymentsDataSource.data = response.payments;
          console.log(this.paymentDataSource);
          
        });
    
      }
    }

    getFileExtension(filename: string): string {     const extension = filename.split('.').pop();     return extension ? extension.toLowerCase() : '';   }

}
