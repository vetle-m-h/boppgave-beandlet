# imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import mysql.connector
import json
import re

# fastapi app
app = FastAPI()

# control access origin http
origins = [
    'http://192.168.0.40:8080',
    'http://192.168.0.101:5500',
    'http://localhost:8080',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://192.168.0.101:5500',
]
# origins can access these methods
methods = [
    'return_process_names()',
    'return_process()',
]
# adding the control parameters to the api app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=methods,
    allow_headers=["*"],
)

# api for getting all processes for given customer
@app.get('/{customer_name}/')
def return_process_names(customer_name: str):
    try:
        # input validation
        pat = re.compile('^[a-zæøåA-ZÆØÅ0-9-_]{1,50}$')
        if re.fullmatch(pat, customer_name):
            name_list = get_data_from_db(customer_name)
            return JSONResponse(name_list)
        else:
            return JSONResponse({'Error' : 'input validation failed'})
    except:
        return JSONResponse({'Error' : 'return_process_names() failed'})

#api for getting the full analyzed customer
@app.get('/{customer_name}/{process_id}')
def return_process(customer_name: str, process_id: str):
    try:
        pat = re.compile('^[a-zæøåA-ZÆØÅ0-9-_]+$')
        # input validation
        if re.fullmatch(pat, customer_name) is None:
            return JSONResponse({'Error' : 'customer input validation failed'})
        elif re.fullmatch(pat, process_id) is None:
            return JSONResponse({'Error' : 'process input validation failed'})
        else:
            content = get_data_from_db(customer_name, process_id)
            return JSONResponse(content)
    except:
        return JSONResponse({'Error' : 'return_process() failed'})


def get_data_from_db(customer_name: str, process_id: str = ''):
    # if the client is looking for processes connected to customer
    if process_id == '':
        try:
            process_short_list = []
            # mysql connection
            mydb = mysql.connector.connect(
                host="mysqldb-filt",
                user="root",
                password="Password-123",
                database=customer_name
            )
            cursor = mydb.cursor()
            # selecting all content from the xml table
            cursor.execute(f'SELECT processId, name FROM xml')
            # storing the result from db in variable
            db_list = cursor.fetchall()
            cursor.close()
            for item in db_list:
                process_obj = {
                    'id' : item[0],
                    'name' : item[1],
                }
                process_short_list.append(process_obj)
            # returning the variable
            return process_short_list
        except:
            # customer name error
            return {'Error' : 'No customer found'}
        
    # else the client is looking for a specific process
    else:
        try:
            # mysql connection
            mydb = mysql.connector.connect(
                host="mysqldb-filt",
                user="root",
                password="Password-123",
                database=customer_name
            )
            cursor = mydb.cursor()
            # selecting all content from the xml table
            cursor.execute(f'SELECT content FROM xml WHERE processId = "{process_id}"')
            # storing the result from db in variable
            content = cursor.fetchone()
            cursor.close()
            # parsing the response
            content = json.loads(content[0])
            # returning the process list
            return content
        except:
            # process name error
            return {'Error' : 'No process found'}