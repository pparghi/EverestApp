import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataTableDirective, DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MemberClientsService } from '../../services/member-clients.service';
import { ClientsDebtorsService } from '../../services/clients-debtors.service';

interface DataItem {
  Client: string;
  Age0to30: string;  
  Age31to60: string;  
  Age61to90: string;  
  Age91to120: string;  
  Age121to150: string;  
  Age151to180: string;  
  AgeOver180: string;  
  Balance: string;  
  expandedDetail: { detail: string };
}


@Component({
  selector: 'app-clients-debtors',
  templateUrl: './clients-debtors.component.html',
  styleUrl: './clients-debtors.component.css'
})
export class ClientsDebtorsComponent implements OnInit {
  displayedColumns: string[] = ['expand', 'Debtor', 'Currency', 'Balance', 'CreditLimit', 'AIG Coverage', 'Utilization of AIG Coverage', 'NOA','%% Verified', 'Payments'];
    isLoading = true;
    dataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;
    MemberClientKey!: number;
    displayDebtor: any;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

  constructor(private route: ActivatedRoute, private dataService: ClientsDebtorsService , private router: Router){}
    
    ngOnInit(): void {
      this.route.queryParams.subscribe(params => {        
        const MemberClientKey = +params['MemberClientKey'];        
        this.MemberClientKey = MemberClientKey
        this.displayDebtor = params['Debtor']                
        this.loadClientDebtorsDetails(MemberClientKey);
      });
    }

    loadClientDebtorsDetails(MemberClientKey: number): void {            
      this.dataService.getClientsDebtors(MemberClientKey).subscribe(response => {        
        this.dataSource.data = response.data;
      });
    }

    openClientsDebtorWindow(DebtorKey: number): void {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/clients'], { queryParams: { DebtorKey: DebtorKey } })
      );
      window.open(url, '_blank');
    }

    applyFilter(event: Event): void {
      const filterValue = (event.target as HTMLInputElement).value;
      this.filter = filterValue.trim().toLowerCase(); 
      this.paginator.pageIndex = 0; 
      this.loadClientDebtorsDetails(this.MemberClientKey);
    }
    
    get totalPages(): number { 
      const pageSize = this.paginator?.pageSize || 25;
      return Math.ceil(this.totalRecords /  pageSize); 
    } 
        
    goToPage(): void { 
      if (this.specificPage < 1 || this.specificPage > this.totalPages) { 
        return;             
      } 
      if (this.paginator) {
        this.paginator.pageIndex = this.specificPage - 1;
        this.loadClientDebtorsDetails(this.MemberClientKey);
      }
      
    }

    toggleRow(element: DataItem): void {                        
      this.expandedElement = this.expandedElement === element ? null : element;          
    }

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');
}

